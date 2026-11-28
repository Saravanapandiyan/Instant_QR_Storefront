import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  ShoppingBag,
  Utensils,
  Download,
  Calendar,
  Store,
  RotateCw,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Smartphone,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { analyticsApi, type AnalyticsResponse } from './api/analyticsApi';
import { Button, DatePicker, toast } from '../../components/ui';

function getLocalDateInputString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AnalyticsPage: React.FC = () => {
  const { restaurants } = useRestaurants();
  const { branches } = useBranches();
  const { formatPrice } = useCurrencyStore();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState<boolean>(false);
  const [draftStartDate, setDraftStartDate] = useState<string>('');
  const [draftEndDate, setDraftEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-select first restaurant
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  // Branches filtered for selected restaurant
  const filteredBranches = useMemo(() => {
    if (!selectedRestaurantId) return branches;
    return branches.filter((b) => b.restaurantId === selectedRestaurantId);
  }, [branches, selectedRestaurantId]);

  // Fetch analytics
  const fetchAnalytics = async (showLoading = false) => {
    if (!selectedRestaurantId) return;
    if (period === 'custom' && (!startDate || !endDate)) return;
    if (showLoading) setIsLoading(true);

    try {
      const res = await analyticsApi.getAnalytics(selectedRestaurantId, {
        branchId: selectedBranchId === 'ALL' ? undefined : selectedBranchId,
        period,
        startDate: period === 'custom' && startDate ? new Date(`${startDate}T00:00:00`).toISOString() : undefined,
        endDate: period === 'custom' && endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : undefined,
      });
      setData(res);
      setCurrentPage(1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch sales analytics');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(true);
  }, [selectedRestaurantId, selectedBranchId, period, startDate, endDate]);

  // Export CSV
  const handleExportCsv = () => {
    setIsExportOpen(false);
    if (!data || !data.recentOrders || data.recentOrders.length === 0) {
      toast.error('No orders available to export for this period.');
      return;
    }

    const headers = ['Order #', 'Customer', 'Type', 'Table', 'Status', 'Total Amount', 'Branch', 'Date & Time'];
    const rows = data.recentOrders.map((o) => [
      `"#${o.orderNumber}"`,
      `"${(o.customerName || 'Guest').replace(/"/g, '""')}"`,
      `"${o.orderType}"`,
      `"${o.tableNumber || '-'}"`,
      `"${o.status}"`,
      o.totalAmount,
      `"${(o.branchName || '-').replace(/"/g, '""')}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
    ]);

    // Use UTF-8 BOM so Excel opens non-ASCII text correctly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${selectedRestaurantId}_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sales report exported to CSV!');
  };

  // Export Excel (.xls compatible)
  const handleExportExcel = () => {
    setIsExportOpen(false);
    if (!data || !data.recentOrders || data.recentOrders.length === 0) {
      toast.error('No orders available to export for this period.');
      return;
    }

    const headers = ['Order #', 'Customer', 'Type', 'Table', 'Status', 'Total Amount', 'Branch', 'Date & Time'];
    const rows = data.recentOrders.map((o) => [
      `#${o.orderNumber}`,
      o.customerName || 'Guest',
      o.orderType,
      o.tableNumber || '-',
      o.status,
      o.totalAmount,
      o.branchName || '-',
      new Date(o.createdAt).toLocaleString(),
    ]);

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Sales Report</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <h2>Sales Report (${period.toUpperCase()}) - ${new Date().toLocaleDateString()}</h2>
        <table border="1">
          <thead>
            <tr style="background-color: #f37135; color: #ffffff; font-weight: bold;">
              ${headers.map((h) => `<th style="padding: 8px 12px; border: 1px solid #ddd;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${r.map((c) => `<td style="padding: 6px 10px; border: 1px solid #eee;">${c}</td>`).join('')}</tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${selectedRestaurantId}_${period}_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sales report exported to Excel (.xls)!');
  };

  const summary = data?.summary;
  const hourlyPeak = data?.hourlyPeak || [];
  const topDishes = data?.topDishes || [];

  // Max peak order count for relative bar heights
  const maxHourlyOrders = useMemo(() => {
    return Math.max(...hourlyPeak.map((h) => h.orderCount), 1);
  }, [hourlyPeak]);

  // Pagination for Order Audit Ledger
  const allRecentOrders = data?.recentOrders || [];
  const totalOrdersCount = allRecentOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrdersCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return allRecentOrders.slice(startIdx, startIdx + pageSize);
  }, [allRecentOrders, safeCurrentPage, pageSize]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
        {/* Header Toolbar (Admin-inspired 2-row layout) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-4">
          {/* Row 1: Title & Concept / Branch Dropdowns */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-text">
                  Sales Analytics &amp; Reports
                </h1>
                <p className="text-xs text-muted mt-0.5">
                  Daily revenue velocity, top dishes, peak hours &amp; operational reports
                </p>
              </div>
            </div>

            {/* Concept & Branch Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:items-center gap-2.5 w-full xl:w-auto shrink-0">
              {/* Restaurant Concept Dropdown */}
              <div className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-xl px-3 py-2 shadow-2xs w-full xl:w-[230px] min-w-0">
                <UtensilsCrossed className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[11px] font-bold text-muted uppercase whitespace-nowrap shrink-0">
                  Concept:
                </span>
                <select
                  aria-label="Select Restaurant Concept"
                  value={selectedRestaurantId}
                  onChange={(e) => {
                    setSelectedRestaurantId(e.target.value);
                    setSelectedBranchId('ALL');
                  }}
                  className="bg-transparent text-xs font-bold text-text focus:outline-none cursor-pointer w-full min-w-0 truncate"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id} className="bg-surface text-text">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Outlet Dropdown */}
              <div className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-xl px-3 py-2 shadow-2xs w-full xl:w-[230px] min-w-0">
                <Store className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-bold text-muted uppercase whitespace-nowrap shrink-0">
                  Branch:
                </span>
                <select
                  aria-label="Select Outlet"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent border-none font-bold text-xs focus:outline-none cursor-pointer text-text w-full min-w-0 truncate"
                >
                  <option value="ALL" className="bg-surface text-text">
                    All Outlets ({filteredBranches.length})
                  </option>
                  {filteredBranches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-surface text-text">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Date Range Filters & Export */}
          {(() => {
            const periodOptions: { id: 'today' | '7d' | '30d' | 'all' | 'custom'; label: string }[] = [
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All' },
              { id: 'custom', label: 'Custom' },
            ];
            const openCustomModal = () => {
              const todayStr = getLocalDateInputString(new Date());
              setDraftStartDate(startDate || todayStr);
              setDraftEndDate(endDate || todayStr);
              setIsCustomRangeOpen(true);
            };

            return (
              <div className="pt-3.5 border-t border-border/60 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 min-w-0 w-full sm:w-auto">
                  {/* Mobile (<640px): Clean Date Dropdown */}
                  <div className="flex sm:hidden items-center gap-2 bg-surface-2 border border-border rounded-xl px-3 py-2 text-xs font-semibold w-full">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-muted font-bold uppercase text-[11px] shrink-0">
                      Date:
                    </span>
                    <select
                      aria-label="Filter analytics by date range"
                      value={period}
                      onChange={(e) => {
                        const next = e.target.value as typeof period;
                        if (next === 'custom') {
                          openCustomModal();
                        } else {
                          setPeriod(next);
                        }
                      }}
                      className="bg-transparent border-none text-text font-bold focus:outline-none text-xs cursor-pointer w-full min-w-0"
                    >
                      {periodOptions.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-surface text-text">
                          {opt.label === 'All' ? 'All Time' : opt.label === 'Custom' ? 'Custom Range' : opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tablet & Desktop (>=640px): Date Range Label + Period Pills */}
                  <div className="hidden sm:flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 mr-1 whitespace-nowrap shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>Date Range:</span>
                    </span>

                    <div className="inline-flex p-1 rounded-xl border border-border bg-surface-2 shrink-0">
                      {periodOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (opt.id === 'custom') {
                              openCustomModal();
                            } else {
                              setPeriod(opt.id);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                            period === opt.id
                              ? 'bg-primary text-on-primary shadow-xs'
                              : 'text-muted hover:text-text'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Custom Range Summary Chip */}
                  {period === 'custom' && (
                    <button
                      type="button"
                      onClick={openCustomModal}
                      className="inline-flex items-center justify-between sm:justify-start gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors cursor-pointer w-full sm:w-auto"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {startDate || 'Start'} &rarr; {endDate || 'End'}
                        </span>
                      </span>
                      <span className="text-[11px] underline font-bold">Change</span>
                    </button>
                  )}
                </div>

                {/* Export Dropdown (Excel, CSV) */}
                <div className="relative w-full sm:w-auto sm:ml-auto" ref={exportDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(!isExportOpen)}
                    className="w-full sm:w-auto justify-center px-3.5 py-2 sm:py-1.5 rounded-xl border border-border bg-surface-2 text-text hover:border-primary/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Export Sales Data"
                  >
                    <Download className="w-3.5 h-3.5 text-primary" />
                    <span>Export</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
                        isExportOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-surface border border-border shadow-xl py-1.5 z-30 animate-fadeIn text-xs">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-text hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold">Export as Excel</p>
                      <p className="text-[10px] text-muted">.xlsx / .xls formatted</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2.5 text-text hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold">Export as CSV</p>
                      <p className="text-[10px] text-muted">Raw comma-separated</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
            );
          })()}
        </div>

        {/* Custom Date Range Popup Modal (all screen sizes) */}
        {isCustomRangeOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsCustomRangeOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-text">Select Custom Date Range</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomRangeOpen(false)}
                  aria-label="Close date range modal"
                  className="p-1 rounded-lg text-muted hover:text-text hover:bg-surface-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted">From Date</label>
                  <DatePicker
                    ariaLabel="Start Date"
                    placeholder="Start date"
                    value={draftStartDate}
                    max={draftEndDate || getLocalDateInputString(new Date())}
                    onChange={setDraftStartDate}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted">To Date</label>
                  <DatePicker
                    ariaLabel="End Date"
                    placeholder="End date"
                    value={draftEndDate}
                    min={draftStartDate || undefined}
                    max={getLocalDateInputString(new Date())}
                    onChange={setDraftEndDate}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCustomRangeOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setStartDate(draftStartDate);
                    setEndDate(draftEndDate);
                    setPeriod('custom');
                    setIsCustomRangeOpen(false);
                  }}
                >
                  Apply Range
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 4 Core KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Gross Revenue */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-text tracking-tight">
                {formatPrice(summary?.totalGrossRevenue || 0)}
              </span>
              <p className="text-[11px] text-muted mt-1">
                Tax: {formatPrice(summary?.totalTax || 0)} • {summary?.completedOrders || 0} served
              </p>
            </div>
          </div>

          {/* 2. Total Orders */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-text tracking-tight">
                {summary?.totalOrders || 0}
              </span>
              <p className="text-[11px] text-muted mt-1">
                Orders placed in selected period
              </p>
            </div>
          </div>

          {/* 3. Average Order Value */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Average Order Value</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-text tracking-tight">
                {formatPrice(summary?.averageOrderValue || 0)}
              </span>
              <p className="text-[11px] text-muted mt-1">
                Per confirmed customer cart
              </p>
            </div>
          </div>

          {/* 4. Average Kitchen Prep Time */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Kitchen Prep</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-text tracking-tight">
                {summary?.averagePrepTimeMinutes || 15} mins
              </span>
              <p className="text-[11px] text-muted mt-1">
                Live duration on KDS display
              </p>
            </div>
          </div>
        </div>

        {/* Channels & Payment Breakdown Cards (matching Overview) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 5: Dine-in Orders */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Dine-in orders</span>
              <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-soft-text flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-text tracking-tight">
                {summary?.dineInOrders || 0}
              </span>
              <p className="text-[11px] text-muted mt-1">
                In-store table orders
              </p>
            </div>
          </div>

          {/* Card 6: Takeaway Orders */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Takeaway orders</span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-text tracking-tight">
                {summary?.takeawayOrders || 0}
              </span>
              <p className="text-[11px] text-muted mt-1">
                Counter pickup orders
              </p>
            </div>
          </div>

          {/* Card 7: Cash on Counter */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Cash on counter</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-text tracking-tight">
                {formatPrice(summary?.cashCollected || 0)}
              </span>
              <p className="text-[11px] text-muted mt-1">
                {summary?.cashOrdersCount || 0} cash {summary?.cashOrdersCount === 1 ? 'order' : 'orders'}
              </p>
            </div>
          </div>

          {/* Card 8: Online & UPI Payments */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Online & UPI payments</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl font-black text-text tracking-tight">
                {formatPrice(summary?.onlineCollected || 0)}
              </span>
              <p className="text-[11px] text-muted mt-1">
                {summary?.onlineOrdersCount || 0} online {summary?.onlineOrdersCount === 1 ? 'order' : 'orders'}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Analytical Breakdown: Peak Hours & Top Selling Dishes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Order Velocity & Peak Rush */}
          <div className="p-4 sm:p-6 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between min-w-0">
            <div className="flex items-start sm:items-center justify-between gap-2 pb-4 border-b border-border">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-text">Peak Ordering Rush Hours</h2>
                <p className="text-xs text-muted">Distribution of tickets across 24-hour cycle</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 whitespace-nowrap shrink-0">
                Peak Velocity
              </span>
            </div>

            {/* Horizontal timeline bar graph */}
            <div className="pt-6 pb-2">
              <div className="flex items-end gap-1 sm:gap-1.5 h-44">
                {hourlyPeak
                  // Show daytime hours 8 AM to 10 PM in primary preview
                  .filter((h) => h.hour >= 8 && h.hour <= 22)
                  .map((h) => {
                    const heightPercent =
                      maxHourlyOrders > 0
                        ? Math.max(12, Math.round((h.orderCount / maxHourlyOrders) * 100))
                        : 12;

                    return (
                      <div
                        key={h.hour}
                        className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                          {h.label}: {h.orderCount} orders ({formatPrice(h.revenue)})
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all ${
                            h.orderCount > 0
                              ? 'bg-gradient-to-t from-primary to-orange-400 group-hover:brightness-110 shadow-xs'
                              : 'bg-surface-2 border border-border'
                          }`}
                        />

                        {/* Label */}
                        <span className="text-[8px] sm:text-[9px] font-semibold text-muted mt-2">
                          {h.hour}h
                        </span>
                      </div>
                    );
                  })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 text-[10px] sm:text-[11px] text-muted border-t border-border mt-3">
                <span className="whitespace-nowrap">Morning (8 AM)</span>
                <span className="whitespace-nowrap">Lunch (1 PM)</span>
                <span className="whitespace-nowrap">Dinner (8 PM)</span>
              </div>
            </div>
          </div>

          {/* Top 10 Selling Dishes Leaderboard */}
          <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-text">Top-Selling Dishes Leaderboard</h2>
                <p className="text-xs text-muted">Most ordered items by customer volume</p>
              </div>
              <Award className="w-5 h-5 text-amber-500" />
            </div>

            <div className="pt-4 divide-y divide-border overflow-y-auto max-h-72">
              {topDishes.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">
                  No dish sales recorded for this period yet.
                </div>
              ) : (
                topDishes.map((dish, idx) => (
                  <div key={dish.name} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-zinc-950 shadow-xs'
                            : idx === 1
                            ? 'bg-slate-300 text-zinc-900 shadow-xs'
                            : idx === 2
                            ? 'bg-amber-700/60 text-amber-100 shadow-xs'
                            : 'bg-surface-2 text-muted border border-border'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-text truncate">{dish.name}</p>
                        <p className="text-[11px] text-muted">
                          {dish.quantity} orders placed
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-text shrink-0">
                      {formatPrice(dish.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Order Logs Table */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-text">Order Audit Ledger</h2>
              <p className="text-xs text-muted">Detailed log of recent orders for reconciliation</p>
            </div>
            <span className="text-xs font-bold text-muted">
              {data?.recentOrders.length || 0} Tickets
            </span>
          </div>

          <div className="overflow-x-auto pt-3">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted text-xs">
                      No order transactions found for this period.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-text">
                        #{ord.orderNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-text">
                        {ord.customerName || 'Walk-in Guest'}
                      </td>
                      <td className="py-3 px-3 text-muted">
                        {ord.orderType === 'DINE_IN' ? (
                          <span className="inline-flex items-center gap-1">
                            <Utensils className="w-3 h-3 text-amber-500" />
                            {ord.tableNumber || 'Dine-In'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3 text-primary" />
                            Takeaway
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-muted">
                        {ord.branchName || 'Main Store'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ord.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : ord.status === 'READY'
                              ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                              : ord.status === 'PREPARING'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-surface-2 text-muted border border-border'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black text-text text-right">
                        {formatPrice(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-muted text-right font-mono text-[11px]">
                        {new Date(ord.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalOrdersCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-3 border-t border-border text-xs">
              <div className="flex items-center gap-3 text-muted">
                <span>
                  Showing <strong className="text-text">{(safeCurrentPage - 1) * pageSize + 1}</strong>–
                  <strong className="text-text">{Math.min(safeCurrentPage * pageSize, totalOrdersCount)}</strong> of{' '}
                  <strong className="text-text">{totalOrdersCount}</strong> orders
                </span>
                <select
                  aria-label="Rows per page"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-border bg-surface-2 text-text font-semibold text-xs focus:outline-none cursor-pointer"
                >
                  {[10, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-surface-2 text-text font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pageNum) => {
                    if (totalPages <= 5) return true;
                    if (pageNum === 1 || pageNum === totalPages) return true;
                    return Math.abs(pageNum - safeCurrentPage) <= 1;
                  })
                  .reduce<(number | 'ellipsis')[]>((acc, pageNum, idx, arr) => {
                    if (idx > 0 && pageNum - (arr[idx - 1] as number) > 1) {
                      acc.push('ellipsis');
                    }
                    acc.push(pageNum);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-muted">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCurrentPage(item)}
                        className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          safeCurrentPage === item
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'border border-border bg-surface-2 text-muted hover:text-text'
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}

                <button
                  type="button"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-border bg-surface-2 text-text font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
