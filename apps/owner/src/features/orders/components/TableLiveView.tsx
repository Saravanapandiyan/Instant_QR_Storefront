import React, { useState, useEffect } from 'react';
import {
  Layers,
  Users,
  Clock,
  ShoppingBag,
  ExternalLink,
  QrCode,
  RotateCw,
  Sparkles,
  ChevronRight,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { branchesApi } from '../../branches/api/branchesApi';
import type { Branch, RestaurantTable } from '@instant-qr/shared-types';
import { TableQrModal } from '../../branches/components/TableQrModal';
import { InstagramQRModal } from '../../branches/components/InstagramQRModal';
import { useCurrencyStore } from '../../../store/useCurrencyStore';

interface TableLiveViewProps {
  branch: Branch;
  onSelectOrder: (orderId: string) => void;
}

export const TableLiveView: React.FC<TableLiveViewProps> = ({
  branch,
  onSelectOrder,
}) => {
  const { formatPrice } = useCurrencyStore();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [selectedTableForStudio, setSelectedTableForStudio] = useState<string | null>(null);
  const [tick, setTick] = useState<number>(0);

  const fetchTables = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await branchesApi.getBranchTables(branch.id);
      setTables(data);
    } catch (err) {
      console.error('Failed to load live tables', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables(true);
    // Poll every 6 seconds for live floor updates
    const interval = setInterval(() => {
      fetchTables(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [branch.id]);

  // Second-by-second ticker for live duration timers
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sections = Array.from(new Set(tables.map((t) => t.section || 'Main Room')));

  const filteredTables = tables.filter((t) => {
    if (filterSection === 'ALL') return true;
    return (t.section || 'Main Room') === filterSection;
  });

  const occupiedTables = tables.filter((t) => Boolean(t.activeOrder));
  const availableTables = tables.filter((t) => !t.activeOrder);

  const formatElapsed = (createdAtStr: string) => {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(createdAtStr).getTime()) / 1000),
    );
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Floor Plan Header & KPI Stats */}
      <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-text">
              Floor Plan & Table Orders
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              LIVE FLOOR
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Real-time table occupancy & open orders for <span className="font-semibold text-text">{branch.name}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedTableForStudio(null);
              setIsStudioOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>QR Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Tables Setup & List</span>
          </button>

          <button
            type="button"
            onClick={() => fetchTables(true)}
            className="p-2 rounded-xl border border-border bg-surface-2 hover:bg-surface text-muted hover:text-text transition-colors cursor-pointer"
            title="Refresh floor status"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Total Tables
            </span>
            <p className="text-2xl font-black text-text mt-0.5">{tables.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-2 text-muted flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Occupied (Open Orders)
            </span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {occupiedTables.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Available / Vacant
            </span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {availableTables.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sections Filter */}
      {sections.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-muted uppercase tracking-wider mr-1">
            Filter Section:
          </span>
          <button
            type="button"
            onClick={() => setFilterSection('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterSection === 'ALL'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'border border-border bg-surface-2 text-muted hover:text-text'
            }`}
          >
            All Areas ({tables.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setFilterSection(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterSection === sec
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'border border-border bg-surface-2 text-muted hover:text-text'
              }`}
            >
              {sec} ({tables.filter((t) => t.section === sec).length})
            </button>
          ))}
        </div>
      )}

      {/* Live Table Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-muted">
          Loading floor plan status...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="py-16 text-center space-y-3 p-8 rounded-3xl bg-surface border border-border">
          <Layers className="w-8 h-8 text-muted mx-auto" />
          <p className="text-sm font-bold text-text">No tables setup for this branch yet</p>
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer"
          >
            Generate Tables & QR Codes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const hasOrder = Boolean(table.activeOrder);
            const ord = table.activeOrder;

            return (
              <div
                key={table.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                  hasOrder
                    ? 'border-amber-500/50 bg-amber-500/5 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20'
                    : 'border-border bg-surface hover:border-border-2 shadow-xs'
                }`}
              >
                {/* Table Header Row */}
                <div>
                  <div className="flex items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          hasOrder
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-surface-2 text-muted border border-border'
                        }`}
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-text leading-tight truncate">
                          {table.tableNumber}
                        </h4>
                        <p className="text-[10px] text-muted font-medium truncate mt-0.5">
                          {table.section || 'Main Room'} • {table.capacity || 4} Guests
                        </p>
                      </div>
                    </div>

                    {hasOrder ? (
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white whitespace-nowrap shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>Open Order</span>
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Active Order Details or Vacant State */}
                  {hasOrder && ord ? (
                    <div className="my-3 p-3.5 rounded-2xl bg-surface border border-amber-500/30 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-text">
                          Order #{ord.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            ord.status === 'READY'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                              : ord.status === 'PREPARING'
                              ? 'bg-primary/15 text-primary border border-primary/25'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-muted">
                          <span>Customer:</span>
                          <span className="font-semibold text-text truncate max-w-[130px]">
                            {ord.customerName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-muted">
                          <span>Dishes:</span>
                          <span className="font-semibold text-text">
                            {ord.itemCount} {ord.itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-muted pt-1.5 border-t border-border/60">
                          <span className="font-bold text-text">Total:</span>
                          <span className="font-black text-text text-sm">
                            {formatPrice(ord.totalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 pt-1">
                        <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
                        <span>Elapsed: {formatElapsed(ord.createdAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="my-6 text-center text-xs text-muted">
                      <p className="font-medium opacity-75">No open orders</p>
                      <p className="text-[11px] opacity-60">Ready for incoming guests</p>
                    </div>
                  )}
                </div>

                {/* Footer action button */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  {hasOrder && ord ? (
                    <button
                      type="button"
                      onClick={() => onSelectOrder(ord.id)}
                      className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      <span>View Order Ticket</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTableForStudio(table.tableNumber);
                        setIsStudioOpen(true);
                      }}
                      className="w-full py-1.5 rounded-xl border border-border bg-surface-2 hover:bg-surface text-muted hover:text-text text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3 h-3 text-primary" />
                      <span>View Table QR</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table QR Management Modal */}
      <TableQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        branch={branch}
        onTablesUpdated={() => fetchTables(false)}
        onOpenStudio={(tableNum) => {
          setSelectedTableForStudio(tableNum || null);
          setIsStudioOpen(true);
        }}
      />

      {/* Styled QR Design Studio Modal */}
      <InstagramQRModal
        isOpen={isStudioOpen}
        onClose={() => {
          setIsStudioOpen(false);
          setSelectedTableForStudio(null);
        }}
        branch={branch}
        restaurant={branch.restaurant}
        initialTableNumber={selectedTableForStudio}
        tables={tables}
      />
    </div>
  );
};
