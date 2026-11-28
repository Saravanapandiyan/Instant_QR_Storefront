import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Printer,
  Plus,
  Trash2,
  QrCode,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
  Users,
  Copy,
  Edit2,
  Palette,
  Loader2,
  Layout,
  Layers,
  Eye,
  UtensilsCrossed,
  ArrowLeft,
  Coffee,
  Pizza,
  Wine,
} from 'lucide-react';
import { branchesApi } from '../api/branchesApi';
import type { Branch, RestaurantTable } from '@instant-qr/shared-types';
import { toast } from '../../../components/ui';
import {
  getCustomerStorefrontUrl,
  getEncryptedStorefrontUrl,
  fetchEncryptedQrTokens,
} from '../../../lib/urls';
import {
  StylizedQRCode,
  type QRDotPattern,
  type QREyePattern,
  type QRShape,
} from './StylizedQRCode';
import {
  THEME_CONFIGS,
  type StandTemplate,
  type ColorTheme,
  type CenterIconType,
  renderStandeeToCanvas,
  renderSvgStringToImage,
  getCenterIconEmoji,
  getSavedStandeeDesign,
  saveStandeeDesign,
} from './standeeRenderer';

interface TableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch;
  onTablesUpdated?: () => void;
  onOpenStudio?: (tableNumber?: string) => void;
}

export const TableQrModal: React.FC<TableQrModalProps> = ({
  isOpen,
  onClose,
  branch,
  onTablesUpdated,
  onOpenStudio,
}) => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterSection, setFilterSection] = useState<string>('ALL');

  // Step Switcher: 'list' (Table Checklist) vs 'design' (Select Design before Download / Print)
  const [viewStep, setViewStep] = useState<'list' | 'design'>('list');
  const [activeAction, setActiveAction] = useState<'download' | 'print'>('download');
  const [designMobileTab, setDesignMobileTab] = useState<'customize' | 'preview'>('customize');

  const initialDesign = getSavedStandeeDesign(branch?.id);

  // Design Studio State
  const [template, setTemplate] = useState<StandTemplate>(initialDesign.template);
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(initialDesign.selectedTheme);
  const [dotPattern, setDotPattern] = useState<QRDotPattern>(initialDesign.dotPattern);
  const [eyePattern, setEyePattern] = useState<QREyePattern>(initialDesign.eyePattern);
  const [shape, setShape] = useState<QRShape>(initialDesign.shape);
  const [centerIcon, setCenterIcon] = useState<CenterIconType>(initialDesign.centerIcon);
  const [previewTableId, setPreviewTableId] = useState<string>('');

  // Always sync with the latest saved design whenever modal opens or branch changes
  useEffect(() => {
    if (isOpen && branch?.id) {
      const saved = getSavedStandeeDesign(branch.id);
      setTemplate(saved.template);
      setSelectedTheme(saved.selectedTheme);
      setDotPattern(saved.dotPattern);
      setEyePattern(saved.eyePattern);
      setShape(saved.shape);
      setCenterIcon(saved.centerIcon);
    }
  }, [isOpen, branch?.id]);

  // Design selection handlers that immediately persist to localStorage
  const handleSelectTemplate = (tpl: StandTemplate) => {
    setTemplate(tpl);
    saveStandeeDesign(branch?.id, { template: tpl });
  };

  const handleSelectTheme = (thm: ColorTheme) => {
    setSelectedTheme(thm);
    saveStandeeDesign(branch?.id, { selectedTheme: thm });
  };

  const handleSelectDotPattern = (pat: QRDotPattern) => {
    setDotPattern(pat);
    saveStandeeDesign(branch?.id, { dotPattern: pat });
  };

  const handleSelectEyePattern = (eye: QREyePattern) => {
    setEyePattern(eye);
    saveStandeeDesign(branch?.id, { eyePattern: eye });
  };

  const handleSelectShape = (sh: QRShape) => {
    setShape(sh);
    saveStandeeDesign(branch?.id, { shape: sh });
  };

  const handleSelectCenterIcon = (ic: CenterIconType) => {
    setCenterIcon(ic);
    saveStandeeDesign(branch?.id, { centerIcon: ic });
  };

  // New Table / Bulk Create form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [isBulk, setIsBulk] = useState<boolean>(true);
  const [newPrefix, setNewPrefix] = useState<string>('Table ');
  const [newStart, setNewStart] = useState<number>(1);
  const [newCount, setNewCount] = useState<number>(6);
  const [newSection, setNewSection] = useState<string>('Main Room');
  const [newCapacity, setNewCapacity] = useState<number>(4);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Table Editing state
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState<string>('');
  const [editSection, setEditSection] = useState<string>('');
  const [editCapacity, setEditCapacity] = useState<number>(4);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Bulk Downloading state
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [encryptedTableTokens, setEncryptedTableTokens] = useState<Record<string, string>>({});

  const fetchTables = async (isCancelled?: () => boolean) => {
    setIsLoading(true);
    try {
      const data = await branchesApi.getBranchTables(branch.id);
      if (isCancelled?.()) return;

      let tokens: Record<string, string> = {};
      if (branch?.slug && data.length > 0) {
        try {
          const res = await fetchEncryptedQrTokens(
            branch.slug,
            data.map((t) => t.tableNumber),
          );
          tokens = res.tableTokens || {};
        } catch {
          // fallback to legacy URLs if token endpoint fails
        }
      }
      if (isCancelled?.()) return;

      setEncryptedTableTokens(tokens);
      setTables(data);
      // Select all tables by default
      setSelectedIds(data.map((t) => t.id));
      if (data.length > 0 && !previewTableId) {
        setPreviewTableId(data[0].id);
      }
    } catch (err: any) {
      if (!isCancelled?.()) {
        toast.error(err.message || 'Failed to load branch tables');
      }
    } finally {
      if (!isCancelled?.()) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen || !branch?.id) return;
    let cancelled = false;
    fetchTables(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [isOpen, branch?.id]);

  if (!isOpen) return null;

  const currentTheme = THEME_CONFIGS[selectedTheme];
  const restaurantName = branch.restaurant?.name || branch.name || 'Restaurant';

  const sections = Array.from(new Set(tables.map((t) => t.section || 'Main Room')));

  const filteredTables = tables.filter((t) => {
    if (filterSection === 'ALL') return true;
    return (t.section || 'Main Room') === filterSection;
  });

  const allFilteredSelected =
    filteredTables.length > 0 &&
    filteredTables.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredTables.map((t) => t.id));
      setSelectedIds(selectedIds.filter((id) => !filteredIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredTables.map((t) => t.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getTableUrl = (tableNumber: string) => {
    const token = encryptedTableTokens[tableNumber];
    if (token) {
      return getEncryptedStorefrontUrl(token);
    }
    return getCustomerStorefrontUrl(branch.slug, tableNumber);
  };

  const selectedTables = tables.filter((t) => selectedIds.includes(t.id));
  const activePreviewTable =
    tables.find((t) => t.id === previewTableId) || selectedTables[0] || tables[0];

  const handleCreateTables = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      if (isBulk) {
        await branchesApi.bulkCreateTables(branch.id, {
          prefix: newPrefix,
          startNumber: newStart,
          count: newCount,
          section: newSection,
          capacity: Number(newCapacity) || 4,
        });
        toast.success(`Generated ${newCount} tables successfully!`);
      } else {
        await branchesApi.createTable(branch.id, {
          tableNumber: `${newPrefix}${newStart}`.trim(),
          section: newSection,
          capacity: Number(newCapacity) || 4,
        });
        toast.success(`Table created successfully!`);
      }
      setShowAddForm(false);
      await fetchTables();
      onTablesUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create tables');
    } finally {
      setIsCreating(false);
    }
  };

  const startEditTable = (table: RestaurantTable) => {
    setEditingTableId(table.id);
    setEditNumber(table.tableNumber);
    setEditSection(table.section || 'Main Room');
    setEditCapacity(table.capacity || 4);
  };

  const handleSaveEdit = async (tableId: string) => {
    if (!editNumber.trim()) {
      toast.error('Table name / number is required');
      return;
    }
    setIsSavingEdit(true);
    try {
      await branchesApi.updateTable(branch.id, tableId, {
        tableNumber: editNumber.trim(),
        section: editSection.trim(),
        capacity: Number(editCapacity) || 4,
      });
      toast.success('Table updated successfully!');
      setEditingTableId(null);
      await fetchTables();
      onTablesUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update table');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!window.confirm('Are you sure you want to remove this table?')) return;
    try {
      await branchesApi.deleteTable(branch.id, tableId);
      toast.success('Table removed');
      await fetchTables();
      onTablesUpdated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete table');
    }
  };

  // Open Design selection step
  const openDesignStep = (action: 'download' | 'print') => {
    if (selectedTables.length === 0) {
      toast.error('Please select at least one table first.');
      return;
    }
    setActiveAction(action);
    setViewStep('design');
  };

  // Trigger Print with chosen design
  const handleTriggerPrint = () => {
    if (selectedTables.length === 0) {
      toast.error('Please select at least one table to print.');
      return;
    }
    window.print();
  };

  // Generate and Download matching high-res PNG Standee for all selected tables
  const handleDownloadSelectedStandees = async () => {
    if (selectedTables.length === 0) {
      toast.error('Please select at least one table to download.');
      return;
    }
    setIsDownloading(true);
    toast.info(`Generating ${selectedTables.length} styled standee card(s)...`);

    try {
      for (const t of selectedTables) {
        const svgElement = document.getElementById(`stylized-qr-${t.id}`);
        if (!svgElement) continue;

        const clone = svgElement.cloneNode(true) as SVGSVGElement;
        clone.setAttribute('width', '600');
        clone.setAttribute('height', '600');
        const svgString = new XMLSerializer().serializeToString(clone);
        const qrImg = await renderSvgStringToImage(svgString, 600);

        const targetWidth = 1200;
        const targetHeight = template === 'badge' ? 1200 : 1600;
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        renderStandeeToCanvas(ctx, {
          width: targetWidth,
          height: targetHeight,
          template,
          colorTheme: selectedTheme,
          restaurantName,
          branchAddressOrName: branch.address || branch.name,
          tableNumber: t.tableNumber,
          customerUrl: getTableUrl(t.tableNumber),
          qrImg,
          centerIcon,
        });

        const link = document.createElement('a');
        link.download = `${branch.slug}-${t.tableNumber.toLowerCase().replace(/\s+/g, '-')}-${template}-stand.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        await new Promise((r) => setTimeout(r, 220));
      }
      toast.success(`Downloaded ${selectedTables.length} styled standee card(s)!`);
    } catch (err: any) {
      console.error('Download error', err);
      toast.error('Failed to download standees');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="relative w-full max-w-4xl bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* =========================================================================
              VIEW STEP 1: TABLES CHECKLIST & MANAGEMENT
              ========================================================================= */}
          {viewStep === 'list' && (
            <>
              {/* Compact Header */}
              <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border bg-surface-2/40 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-lg font-bold text-text truncate">Table QR Codes</h3>
                    <p className="text-[11px] sm:text-xs text-muted truncate">
                      {branch.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openDesignStep('print')}
                    disabled={selectedTables.length === 0}
                    className="hidden lg:flex px-3.5 py-2 rounded-xl border border-border bg-surface hover:border-primary/50 text-xs font-bold text-text items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-40 whitespace-nowrap shrink-0"
                    title="Select design and print table standees"
                  >
                    <Printer className="w-4 h-4 text-primary shrink-0" />
                    <span>Print Standees</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openDesignStep('download')}
                    disabled={selectedTables.length === 0}
                    className="hidden lg:flex px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md disabled:opacity-40 whitespace-nowrap shrink-0"
                    title="Select design and download high-res PNG standees"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Download ({selectedTables.length}) QR Codes</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="p-1.5 sm:p-2 rounded-xl text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto">
                {/* Mobile Primary Actions (< lg) */}
                <div className="lg:hidden px-4 pt-3 pb-2.5 border-b border-border bg-surface grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openDesignStep('print')}
                    disabled={selectedTables.length === 0}
                    className="px-3 py-2 rounded-xl border border-border bg-surface hover:border-primary/50 text-xs font-bold text-text flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-40 whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openDesignStep('download')}
                    disabled={selectedTables.length === 0}
                    className="px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-xs disabled:opacity-40 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Download ({selectedTables.length})</span>
                  </button>
                </div>

                {/* Sub-toolbar: Section Dropdown & Add Table toggle */}
                <div className="px-4 sm:px-6 py-3 border-b border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label
                      htmlFor="qr-section-filter"
                      className="text-[11px] font-bold text-muted uppercase tracking-wider whitespace-nowrap shrink-0"
                    >
                      Section:
                    </label>
                    <select
                      id="qr-section-filter"
                      value={filterSection}
                      onChange={(e) => setFilterSection(e.target.value)}
                      className="flex-1 sm:flex-none sm:min-w-[180px] px-3 py-1.5 rounded-xl border border-border bg-surface-2 text-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="ALL">All Sections ({tables.length})</option>
                      {sections.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec} ({tables.filter((t) => t.section === sec).length})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openDesignStep('download')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Palette className="w-3.5 h-3.5 shrink-0" />
                      <span className="sm:hidden">Design</span>
                      <span className="hidden sm:inline">Standee Design</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-border bg-surface-2 text-text hover:bg-surface text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>{showAddForm ? 'Cancel' : 'Add Tables'}</span>
                    </button>
                  </div>
                </div>

              {/* Add / Bulk Generate Form Drawer */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateTables}
                  className="px-6 py-4 border-b border-border bg-surface-2/60 space-y-4 animate-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text uppercase tracking-wider">
                      Generate Table QR Codes
                    </span>
                    <div className="inline-flex p-1 rounded-xl bg-surface border border-border text-xs">
                      <button
                        type="button"
                        onClick={() => setIsBulk(true)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          isBulk ? 'bg-primary text-on-primary' : 'text-muted'
                        }`}
                      >
                        Bulk Generate (1..N)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBulk(false)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          !isBulk ? 'bg-primary text-on-primary' : 'text-muted'
                        }`}
                      >
                        Single Table
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-muted block mb-1">Prefix</label>
                      <input
                        type="text"
                        value={newPrefix}
                        onChange={(e) => setNewPrefix(e.target.value)}
                        placeholder="Table "
                        className="w-full px-3 py-1.5 rounded-xl border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted block mb-1">Start #</label>
                      <input
                        type="number"
                        min={1}
                        value={newStart}
                        onChange={(e) => setNewStart(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {isBulk && (
                      <div>
                        <label className="text-[11px] font-bold text-muted block mb-1">How Many?</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={newCount}
                          onChange={(e) => setNewCount(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-xl border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-muted block mb-1">Section</label>
                      <input
                        type="text"
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                        placeholder="Main Room"
                        className="w-full px-3 py-1.5 rounded-xl border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted block mb-1">Capacity (Seats)</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-border bg-surface text-text font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="4"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-surface text-muted hover:text-text font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-hover shadow-xs disabled:opacity-50"
                    >
                      {isCreating
                        ? 'Generating...'
                        : isBulk
                        ? `Generate ${newCount} Tables`
                        : 'Create Table'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tables Checklist Table & Mobile Cards */}
              <div>
                {isLoading ? (
                  <div className="py-20 text-center text-xs text-muted">
                    Loading table QR codes...
                  </div>
                ) : filteredTables.length === 0 ? (
                  <div className="py-20 text-center text-xs text-muted">
                    No tables in this section.
                  </div>
                ) : (
                  <>
                    {/* Mobile & Tablet Card List (< lg) */}
                    <div className="lg:hidden">
                      <div className="px-4 py-2.5 bg-surface-2/60 border-b border-border flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="inline-flex items-center gap-2 font-semibold text-text cursor-pointer"
                        >
                          {allFilteredSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted" />
                          )}
                          <span>{allFilteredSelected ? 'Deselect All' : 'Select All'}</span>
                        </button>
                        <span className="text-[11px] text-muted">{filteredTables.length} tables</span>
                      </div>

                      <div className="divide-y divide-border md:divide-y-0 md:grid md:grid-cols-2 md:gap-3 md:p-4">

                      {filteredTables.map((table) => {
                        const isSelected = selectedIds.includes(table.id);
                        const qrUrl = getTableUrl(table.tableNumber);
                        const isEditing = editingTableId === table.id;

                        if (isEditing) {
                          return (
                            <div key={table.id} className="p-4 bg-primary/5 space-y-2.5 text-xs">
                              <input
                                type="text"
                                value={editNumber}
                                onChange={(e) => setEditNumber(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-primary bg-surface text-text text-xs font-bold focus:outline-none"
                                placeholder="Table 1"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={editSection}
                                  onChange={(e) => setEditSection(e.target.value)}
                                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text text-xs focus:outline-none"
                                  placeholder="Main Room"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  max={50}
                                  value={editCapacity}
                                  onChange={(e) => setEditCapacity(Number(e.target.value))}
                                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-medium focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingTableId(null)}
                                  className="px-3 py-1.5 rounded-lg border border-border bg-surface text-muted text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingEdit}
                                  onClick={() => handleSaveEdit(table.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold cursor-pointer flex items-center gap-1"
                                >
                                  {isSavingEdit ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>Save</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={table.id}
                            className={`p-4 space-y-2 text-xs md:rounded-2xl md:border md:border-border ${
                              isSelected ? 'bg-primary/5 md:border-primary/40' : 'md:bg-surface'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => toggleSelect(table.id)}
                                  className="text-primary cursor-pointer shrink-0"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Square className="w-4 h-4 text-muted" />
                                  )}
                                </button>
                                <span className="font-bold text-text truncate">{table.tableNumber}</span>
                                {table.activeOrder && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                    #{table.activeOrder.orderNumber}
                                  </span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                                Active
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[11px] text-muted pl-6">
                              <span>{table.section || 'Main Room'}</span>
                              <span className="inline-flex items-center gap-1 shrink-0">
                                <Users className="w-3 h-3" />
                                {table.capacity || 4} Guests
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pl-6 pt-1">
                              <div className="flex items-center gap-1 font-mono text-[11px] text-muted min-w-0 flex-1">
                                <span className="truncate">{qrUrl}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(qrUrl);
                                    toast.success(`Copied ${table.tableNumber} URL!`);
                                  }}
                                  className="p-1 hover:text-text cursor-pointer shrink-0"
                                  title="Copy URL"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewTableId(table.id);
                                    openDesignStep('download');
                                  }}
                                  className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                  title="Choose Stand Design for this table"
                                >
                                  <Palette className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditTable(table)}
                                  className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                                  title="Edit Table Name / Capacity"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={qrUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                                  title="Open Customer Storefront"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTable(table.id)}
                                  className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Remove Table"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>

                    {/* Desktop Table (lg+) */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-2/60">
                        <th className="py-3 px-4 w-10 text-center">
                          <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="text-primary cursor-pointer"
                            title={allFilteredSelected ? 'Deselect All' : 'Select All'}
                          >
                            {allFilteredSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                              <Square className="w-4 h-4 text-muted" />
                            )}
                          </button>
                        </th>
                        <th className="py-3 px-4 font-bold text-text">Table Name</th>
                        <th className="py-3 px-4 font-bold text-text">Section</th>
                        <th className="py-3 px-4 font-bold text-text">Capacity</th>
                        <th className="py-3 px-4 font-bold text-text">Unique QR URL</th>
                        <th className="py-3 px-4 font-bold text-text">Status</th>
                        <th className="py-3 px-4 text-right font-bold text-text">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTables.map((table) => {
                        const isSelected = selectedIds.includes(table.id);
                        const qrUrl = getTableUrl(table.tableNumber);
                        const isEditing = editingTableId === table.id;

                        if (isEditing) {
                          return (
                            <tr key={table.id} className="bg-primary/5 transition-colors">
                              <td className="py-3 px-4 text-center">
                                <CheckSquare className="w-4 h-4 text-primary" />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={editNumber}
                                  onChange={(e) => setEditNumber(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-primary bg-surface text-text text-xs font-bold focus:outline-none"
                                  placeholder="Table 1"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={editSection}
                                  onChange={(e) => setEditSection(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-xs focus:outline-none"
                                  placeholder="Main Room"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={editCapacity}
                                    onChange={(e) => setEditCapacity(Number(e.target.value))}
                                    className="w-20 px-2 py-1.5 rounded-lg border border-border bg-surface text-text text-xs font-medium focus:outline-none"
                                  />
                                  <span className="text-muted text-[11px]">seats</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-muted font-mono text-[11px] truncate max-w-xs">
                                {qrUrl}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-[10px] font-bold text-emerald-500">Active</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isSavingEdit}
                                    onClick={() => handleSaveEdit(table.id)}
                                    className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer shadow-xs"
                                    title="Save Changes"
                                  >
                                    {isSavingEdit ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTableId(null)}
                                    className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr
                            key={table.id}
                            className={`transition-colors hover:bg-surface-2/40 ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSelect(table.id)}
                                className="text-primary cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-primary" />
                                ) : (
                                  <Square className="w-4 h-4 text-muted" />
                                )}
                              </button>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-text">
                              <div className="flex items-center gap-2">
                                <span>{table.tableNumber}</span>
                                {table.activeOrder && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Order #{table.activeOrder.orderNumber}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-muted font-medium">
                              {table.section || 'Main Room'}
                            </td>

                            <td className="py-3.5 px-4 text-muted font-medium">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-muted" />
                                <span>{table.capacity || 4} Guests</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-muted">
                              <div className="flex items-center gap-1 font-mono text-[11px] truncate max-w-xs">
                                <span className="truncate">{qrUrl}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(qrUrl);
                                    toast.success(`Copied ${table.tableNumber} URL!`);
                                  }}
                                  className="p-1 hover:text-text cursor-pointer"
                                  title="Copy URL"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Active
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Custom Design preview for this table */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewTableId(table.id);
                                    openDesignStep('download');
                                  }}
                                  className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                  title="Choose Stand Design for this table"
                                >
                                  <Palette className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Table Name & Capacity */}
                                <button
                                  type="button"
                                  onClick={() => startEditTable(table)}
                                  className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                                  title="Edit Table Name / Capacity"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Open customer link */}
                                <a
                                  href={qrUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                                  title="Open Customer Storefront"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                {/* Delete table */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTable(table.id)}
                                  className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Remove Table"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              </div>

              {/* Footer Info */}
              <div className="px-4 sm:px-6 py-3 border-t border-border bg-surface-2/40 flex items-center justify-between text-xs text-muted shrink-0">
                <div>
                  <span>Selected {selectedTables.length} of {tables.length} tables</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-border bg-surface text-text font-bold hover:bg-surface-2 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}

          {/* =========================================================================
              VIEW STEP 2: SELECT STANDEE DESIGN & DOWNLOAD / PRINT
              (Ensures Download and Print both use the EXACT chosen design, matching Image 3)
              ========================================================================= */}
          {viewStep === 'design' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="border-b border-border bg-surface-2/40 shrink-0">
                <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setViewStep('list')}
                      className="p-1.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-text transition-colors cursor-pointer shrink-0"
                      title="Back to Table List"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-lg font-bold text-text truncate">
                        <span className="sm:hidden">Standee Design</span>
                        <span className="hidden sm:inline">Select Standee Design & Export</span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-muted truncate">
                        <span className="sm:hidden">{selectedTables.length} table(s) selected</span>
                        <span className="hidden sm:inline">
                          Customizing design for <span className="font-semibold text-text">{selectedTables.length} selected table(s)</span>
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close modal"
                    className="p-1.5 sm:p-2 rounded-xl text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Tab Switcher (< lg) */}
                <div className="lg:hidden px-4 pb-3">
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface-2 border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setDesignMobileTab('customize')}
                      className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        designMobileTab === 'customize'
                          ? 'bg-surface text-text shadow-2xs'
                          : 'text-muted hover:text-text'
                      }`}
                    >
                      Customize
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesignMobileTab('preview')}
                      className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        designMobileTab === 'preview'
                          ? 'bg-surface text-text shadow-2xs'
                          : 'text-muted hover:text-text'
                      }`}
                    >
                      Preview & Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Design Controls (Left) vs Real-Time Preview (Right) */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Controls Column */}
                <div
                  className={`${
                    designMobileTab === 'customize' ? 'block' : 'hidden'
                  } lg:block flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 border-b lg:border-b-0 lg:border-r border-border`}
                >
                  {/* 1. Stand Template Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                      <Layout size={14} className="text-primary" />
                      <span>1. Choose Table Stand Format</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'brand', label: 'Signature Standee', desc: 'Branded restaurant stand (Image 3)' },
                        { id: 'acrylic', label: 'Modern Tent', desc: 'Step 1-2-3 dining guide' },
                        { id: 'luxury', label: 'Fine Dining Card', desc: 'Obsidian & gold elegance' },
                        { id: 'badge', label: 'Bistro Sticker', desc: 'Round decal / coaster' },
                      ].map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tpl.id as StandTemplate)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            template === tpl.id
                              ? 'border-primary ring-2 ring-primary/20 bg-primary/10 font-bold text-text'
                              : 'border-border hover:border-text/30 bg-surface text-muted'
                          }`}
                        >
                          <span className="text-xs font-bold truncate">{tpl.label}</span>
                          <span className="text-[10px] text-muted mt-0.5 line-clamp-1">{tpl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Color Theme Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                      <Palette size={14} className="text-primary" />
                      <span>2. Color Theme</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(THEME_CONFIGS) as ColorTheme[]).map((thm) => {
                        const cfg = THEME_CONFIGS[thm];
                        return (
                          <button
                            key={thm}
                            type="button"
                            onClick={() => handleSelectTheme(thm)}
                            className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                              selectedTheme === thm
                                ? 'border-primary ring-2 ring-primary/20 bg-surface font-bold text-text'
                                : 'border-border hover:border-text/30 bg-surface text-muted'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full shadow-xs shrink-0"
                              style={{ backgroundColor: cfg.primaryColor }}
                            />
                            <span className="text-xs truncate">{cfg.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. QR Module Pattern */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                      <Layers size={14} className="text-primary" />
                      <span>3. QR Module Pattern</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: 'dots', label: '● Dots' },
                        { id: 'tiles', label: '▢ Tiles' },
                        { id: 'diamond', label: '◆ Diamond' },
                        { id: 'bars', label: '▬ Bars' },
                        { id: 'square', label: '■ Classic' },
                      ].map((pat) => (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => handleSelectDotPattern(pat.id as QRDotPattern)}
                          className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                            dotPattern === pat.id
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-border bg-surface text-muted hover:text-text'
                          }`}
                        >
                          {pat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Corner Eye Shape */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                      <Eye size={14} className="text-primary" />
                      <span>4. Corner Eye Shape</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'squircle', label: 'Squircle' },
                        { id: 'circle', label: 'Circle' },
                        { id: 'leaf', label: 'Leaf' },
                        { id: 'square', label: 'Square' },
                      ].map((eye) => (
                        <button
                          key={eye.id}
                          type="button"
                          onClick={() => handleSelectEyePattern(eye.id as QREyePattern)}
                          className={`py-2 px-1 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                            eyePattern === eye.id
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-border bg-surface text-muted hover:text-text'
                          }`}
                        >
                          {eye.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. Center Badge Icon */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                      <UtensilsCrossed size={14} className="text-primary" />
                      <span>5. Center Badge Icon</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
                      {[
                        { id: 'cutlery', label: '🍽️ Dining' },
                        { id: 'coffee', label: '☕ Café' },
                        { id: 'pizza', label: '🍕 Pizza' },
                        { id: 'bar', label: '🍸 Bar' },
                        { id: 'none', label: 'None' },
                      ].map((ic) => (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => handleSelectCenterIcon(ic.id as CenterIconType)}
                          className={`py-2 px-1 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                            centerIcon === ic.id
                              ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                              : 'border-border bg-surface text-muted hover:text-text'
                          }`}
                        >
                          {ic.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Interactive Live Standee Preview Column */}
                <div
                  className={`${
                    designMobileTab === 'preview' ? 'flex' : 'hidden'
                  } lg:flex p-4 sm:p-6 bg-surface-2/60 flex-1 lg:flex-none flex-col items-center justify-between lg:min-w-[420px] overflow-y-auto`}
                >
                  <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs pb-3">
                    <span className="font-bold text-muted uppercase tracking-wider whitespace-nowrap">
                      Previewing:
                    </span>
                    <select
                      value={activePreviewTable?.id}
                      onChange={(e) => setPreviewTableId(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-border bg-surface text-text font-bold text-xs focus:outline-none max-w-full truncate"
                    >
                      {selectedTables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tableNumber} ({t.section || 'Main Room'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Render Selected Standee Card Template Preview */}
                  <div className="my-auto py-2">
                    {template === 'luxury' && activePreviewTable && (
                      <div className="w-full max-w-[280px] sm:w-[310px] sm:max-w-none rounded-3xl p-5 bg-zinc-950 text-white flex flex-col items-center justify-between text-center border-2 border-amber-600/70 shadow-2xl relative overflow-hidden">
                        <div className="space-y-1 w-full relative z-10 pt-1">
                          <span className="text-[9px] tracking-widest uppercase text-amber-300/80 font-serif">
                            Carte du Jour • Fine Dining
                          </span>
                          <h3 className="text-lg font-serif font-bold text-amber-100 tracking-wide line-clamp-1">
                            {restaurantName}
                          </h3>
                          <div className="inline-block px-3 py-0.5 border-y border-amber-400/50 text-amber-200 font-serif font-bold text-xs tracking-widest uppercase my-0.5">
                            {centerIcon !== 'none' && <span className="mr-1">{getCenterIconEmoji(centerIcon)}</span>}
                            <span>{activePreviewTable.tableNumber}</span>
                          </div>
                          <p className="text-[10px] text-amber-200/70 font-serif truncate">
                            {branch.address || branch.name}
                          </p>
                        </div>

                        <div className="my-4 p-3 bg-white shadow-xl relative flex items-center justify-center border-2 border-amber-500/60 rounded-2xl">
                          <StylizedQRCode
                            value={getTableUrl(activePreviewTable.tableNumber)}
                            dotPattern={dotPattern}
                            eyePattern={eyePattern}
                            shape={shape}
                            color1={currentTheme.qrGradient.color1}
                            color2={currentTheme.qrGradient.color2}
                            excavateCenter={centerIcon !== 'none'}
                            className="w-[170px] h-[170px]"
                          />
                          {centerIcon !== 'none' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-10 h-10 rounded-full bg-white border-2 border-amber-600 shadow-sm flex items-center justify-center text-base">
                                {getCenterIconEmoji(centerIcon)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5 relative z-10 pb-1">
                          <div className="text-[11px] font-serif font-bold text-amber-200 uppercase tracking-widest">
                            Scan for Digital Menu
                          </div>
                          <p className="text-[9px] text-amber-100/70">Point phone camera to order</p>
                        </div>
                      </div>
                    )}

                    {template === 'acrylic' && activePreviewTable && (
                      <div className="w-full max-w-[280px] sm:w-[310px] sm:max-w-none rounded-2xl bg-white text-zinc-900 shadow-2xl border border-zinc-200 flex flex-col overflow-hidden">
                        <div className={`p-3.5 ${currentTheme.cardBg} text-white text-center space-y-0.5`}>
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">
                            Dine-In Storefront
                          </span>
                          <h3 className="text-base font-black tracking-tight leading-tight line-clamp-1">
                            {restaurantName}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white font-black text-[10px] tracking-wider uppercase">
                            {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                            <span>{activePreviewTable.tableNumber}</span>
                          </span>
                        </div>

                        <div className="p-3 my-1 flex items-center justify-center relative">
                          <StylizedQRCode
                            value={getTableUrl(activePreviewTable.tableNumber)}
                            dotPattern={dotPattern}
                            eyePattern={eyePattern}
                            shape={shape}
                            color1={currentTheme.qrGradient.color1}
                            color2={currentTheme.qrGradient.color2}
                            excavateCenter={centerIcon !== 'none'}
                            className="w-[165px] h-[165px]"
                          />
                          {centerIcon !== 'none' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div
                                className="w-10 h-10 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-base"
                                style={{ borderColor: currentTheme.primaryColor }}
                              >
                                {getCenterIconEmoji(centerIcon)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="px-3 pb-3 pt-1 space-y-1 text-left text-[10px] font-medium text-zinc-600 bg-zinc-50 border-t border-zinc-100">
                          <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                            <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">1</span>
                            <span>Scan QR with phone camera</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">2</span>
                            <span>Browse dishes & select</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] flex items-center justify-center">3</span>
                            <span>Direct kitchen dispatch</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {template === 'badge' && activePreviewTable && (
                      <div
                        className="w-[250px] h-[250px] sm:w-[280px] sm:h-[280px] rounded-full p-5 bg-white text-zinc-900 shadow-2xl border-6 flex flex-col items-center justify-between text-center relative overflow-hidden"
                        style={{ borderColor: currentTheme.primaryColor }}
                      >
                        <div className="space-y-0.5 pt-1">
                          <span
                            className="text-[10px] font-black uppercase tracking-wider truncate max-w-[200px] block"
                            style={{ color: currentTheme.primaryColor }}
                          >
                            {restaurantName}
                          </span>
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                            style={{
                              backgroundColor: `${currentTheme.primaryColor}15`,
                              color: currentTheme.primaryColor,
                            }}
                          >
                            {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                            <span>{activePreviewTable.tableNumber}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-center relative my-1">
                          <StylizedQRCode
                            value={getTableUrl(activePreviewTable.tableNumber)}
                            dotPattern={dotPattern}
                            eyePattern={eyePattern}
                            shape={shape}
                            color1={currentTheme.qrGradient.color1}
                            color2={currentTheme.qrGradient.color2}
                            excavateCenter={centerIcon !== 'none'}
                            className="w-[145px] h-[145px]"
                          />
                          {centerIcon !== 'none' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div
                                className="w-8 h-8 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-sm"
                                style={{ borderColor: currentTheme.primaryColor }}
                              >
                                {getCenterIconEmoji(centerIcon)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pb-1 text-[8px] font-extrabold uppercase tracking-widest text-zinc-600">
                          Touchless Ordering
                        </div>
                      </div>
                    )}

                    {template === 'brand' && activePreviewTable && (
                      // SIGNATURE RESTAURANT STANDEE (EXACT MATCH FOR IMAGE 3)
                      <div
                        className={`w-full max-w-[280px] sm:w-[310px] sm:max-w-none rounded-3xl p-5 ${currentTheme.cardBg} ${currentTheme.borderGlow} text-white flex flex-col items-center justify-between text-center transition-all duration-300 relative overflow-hidden`}
                      >
                        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-lg pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-black/20 blur-lg pointer-events-none" />

                        <div className="space-y-1 w-full relative z-10">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 text-white font-black text-xs tracking-wider uppercase border border-white/30 shadow-xs mb-0.5">
                            {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                            <span>{activePreviewTable.tableNumber}</span>
                          </div>

                          <div className="text-[10px] font-bold uppercase tracking-wider text-white/90">
                            WELCOME & DINE-IN
                          </div>

                          <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight drop-shadow-xs line-clamp-1">
                            {restaurantName}
                          </h3>
                          <p className="text-[10px] text-white/80 font-medium leading-none line-clamp-1">
                            {branch.address || branch.name}
                          </p>
                        </div>

                        <div className="my-3.5 p-3 bg-white shadow-2xl relative flex items-center justify-center rounded-2xl">
                          <StylizedQRCode
                            value={getTableUrl(activePreviewTable.tableNumber)}
                            dotPattern={dotPattern}
                            eyePattern={eyePattern}
                            shape={shape}
                            color1={currentTheme.qrGradient.color1}
                            color2={currentTheme.qrGradient.color2}
                            excavateCenter={centerIcon !== 'none'}
                            className="w-[165px] h-[165px]"
                          />
                          {centerIcon !== 'none' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div
                                className="w-10 h-10 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-base"
                                style={{ borderColor: currentTheme.primaryColor }}
                              >
                                {getCenterIconEmoji(centerIcon)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5 relative z-10">
                          <div className="text-[11px] font-extrabold uppercase tracking-widest text-white drop-shadow-xs">
                            SCAN FOR DIGITAL MENU
                          </div>
                          <p className="text-[9px] text-white/80 font-medium">
                            Point phone camera • Instant live ordering
                          </p>
                          <div className="pt-1">
                            <span className="font-mono text-[8px] text-white/70 bg-black/20 px-2 py-0.5 rounded-md truncate inline-block max-w-[220px]">
                              {getTableUrl(activePreviewTable.tableNumber).replace('http://', '').replace('https://', '')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar inside Design Studio */}
                  <div className="w-full space-y-2 pt-3 border-t border-border/80">
                    {activeAction === 'print' ? (
                      <>
                        <button
                          type="button"
                          onClick={handleTriggerPrint}
                          disabled={selectedTables.length === 0}
                          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Printer className="w-4 h-4" />
                          <span>PRINT ({selectedTables.length}) STANDEES</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadSelectedStandees}
                          disabled={isDownloading || selectedTables.length === 0}
                          className="w-full py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-text font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 text-primary" />
                          )}
                          <span>DOWNLOAD ({selectedTables.length}) PNG STANDEES</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadSelectedStandees}
                          disabled={isDownloading || selectedTables.length === 0}
                          className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>DOWNLOAD ({selectedTables.length}) PNG STANDEES</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleTriggerPrint}
                          disabled={selectedTables.length === 0}
                          className="w-full py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-text font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-primary" />
                          <span>PRINT ({selectedTables.length}) STANDEES</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>,
        document.body
      )}

      {/* Hidden Vector Elements for High-Res PNG Standee Rendering */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0">
        {tables.map((t) => (
          <div key={`stylized-hidden-${t.id}`}>
            <StylizedQRCode
              id={`stylized-qr-${t.id}`}
              value={getTableUrl(t.tableNumber)}
              dotPattern={dotPattern}
              eyePattern={eyePattern}
              shape={shape}
              color1={currentTheme.qrGradient.color1}
              color2={currentTheme.qrGradient.color2}
              excavateCenter={centerIcon !== 'none'}
              className="w-[600px] h-[600px]"
            />
          </div>
        ))}
      </div>

      {/* =========================================================================
          PRINT PORTAL: Rendered directly on document.body for zero blank pages.
          Renders the EXACT chosen template (Brand, Acrylic, Luxury, Badge) and theme!
          ========================================================================= */}
      {createPortal(
        <div id="table-standee-portal" className="text-black bg-white">
          <div className="grid grid-cols-2 gap-6 p-4">
            {selectedTables.map((t) => {
              const qrUrl = getTableUrl(t.tableNumber);
              const cleanUrl = qrUrl.replace('http://', '').replace('https://', '');

              // 1. FINE DINING LUXURY CARD (Obsidian & Gold)
              if (template === 'luxury') {
                return (
                  <div
                    key={`print-${t.id}`}
                    className="p-8 rounded-3xl bg-zinc-950 text-white flex flex-col items-center justify-between text-center relative overflow-hidden break-inside-avoid page-break-inside-avoid min-h-[500px] border-2 border-amber-600"
                    style={{
                      backgroundColor: '#09090b',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                    }}
                  >
                    <div className="space-y-1.5 w-full relative z-10 pt-1">
                      <span className="text-[10px] tracking-widest uppercase text-amber-300 font-serif block">
                        ✦ Carte du Jour • Fine Dining ✦
                      </span>
                      <h2 className="text-2xl font-serif font-bold text-amber-100 tracking-wide line-clamp-1">
                        {restaurantName}
                      </h2>
                      <div className="inline-block px-4 py-1 border-y border-amber-500/70 text-amber-200 font-serif font-bold text-xs tracking-widest uppercase my-1">
                        {centerIcon !== 'none' && <span className="mr-1">{getCenterIconEmoji(centerIcon)}</span>}
                        <span>{t.tableNumber}</span>
                      </div>
                      <p className="text-xs text-amber-200/80 font-serif truncate">
                        {branch.address || branch.name}
                      </p>
                    </div>

                    <div className="my-4 p-4 bg-white rounded-2xl shadow-xl relative flex items-center justify-center border-2 border-amber-500">
                      <StylizedQRCode
                        value={qrUrl}
                        dotPattern={dotPattern}
                        eyePattern={eyePattern}
                        shape={shape}
                        color1={currentTheme.qrGradient.color1}
                        color2={currentTheme.qrGradient.color2}
                        excavateCenter={centerIcon !== 'none'}
                        className="w-[185px] h-[185px]"
                      />
                      {centerIcon !== 'none' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-11 h-11 rounded-full bg-white border-2 border-amber-600 shadow-sm flex items-center justify-center text-lg">
                            {getCenterIconEmoji(centerIcon)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 relative z-10 pb-1">
                      <div className="text-xs font-serif font-bold text-amber-200 uppercase tracking-widest">
                        Scan for Digital Menu
                      </div>
                      <p className="text-[10px] text-amber-100/80">Point phone camera to order</p>
                      <p className="text-[9px] font-mono text-amber-300/80 truncate max-w-[260px]">
                        {cleanUrl}
                      </p>
                    </div>
                  </div>
                );
              }

              // 2. MODERN TABLETOP TENT (Acrylic)
              if (template === 'acrylic') {
                return (
                  <div
                    key={`print-${t.id}`}
                    className="rounded-3xl bg-white text-zinc-900 border-2 border-zinc-200 flex flex-col justify-between overflow-hidden break-inside-avoid page-break-inside-avoid min-h-[500px] shadow-sm"
                    style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  >
                    <div
                      className="p-5 text-white text-center space-y-1"
                      style={{
                        background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact',
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                        Dine-In Storefront
                      </span>
                      <h2 className="text-xl font-black tracking-tight leading-tight line-clamp-1">
                        {restaurantName}
                      </h2>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-black text-xs tracking-wider uppercase mt-1">
                        {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                        <span>{t.tableNumber}</span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex items-center justify-center relative my-2">
                      <StylizedQRCode
                        value={qrUrl}
                        dotPattern={dotPattern}
                        eyePattern={eyePattern}
                        shape={shape}
                        color1={currentTheme.qrGradient.color1}
                        color2={currentTheme.qrGradient.color2}
                        excavateCenter={centerIcon !== 'none'}
                        className="w-[185px] h-[185px]"
                      />
                      {centerIcon !== 'none' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div
                            className="w-11 h-11 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-lg"
                            style={{ borderColor: currentTheme.primaryColor }}
                          >
                            {getCenterIconEmoji(centerIcon)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-1 text-left text-[11px] font-medium text-zinc-700 bg-zinc-50 border-t border-zinc-200">
                      <div className="flex items-center gap-2 font-bold text-zinc-900">
                        <span
                          className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                          style={{ backgroundColor: currentTheme.primaryColor }}
                        >
                          1
                        </span>
                        <span>Scan QR with phone camera</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                          style={{ backgroundColor: currentTheme.primaryColor }}
                        >
                          2
                        </span>
                        <span>Browse dishes & select</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                          style={{ backgroundColor: currentTheme.primaryColor }}
                        >
                          3
                        </span>
                        <span>Direct kitchen dispatch</span>
                      </div>
                      <div className="pt-1.5 text-center">
                        <span className="font-mono text-[9px] text-zinc-500 truncate inline-block max-w-[260px]">
                          {cleanUrl}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // 3. BISTRO STICKER / ROUND DECAL (Badge)
              if (template === 'badge') {
                return (
                  <div
                    key={`print-${t.id}`}
                    className="w-[340px] h-[340px] mx-auto rounded-full p-6 bg-white text-zinc-900 border-8 flex flex-col items-center justify-between text-center relative overflow-hidden break-inside-avoid page-break-inside-avoid shadow-sm my-4"
                    style={{
                      borderColor: currentTheme.primaryColor,
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                    }}
                  >
                    <div className="space-y-1 pt-1">
                      <span
                        className="text-xs font-black uppercase tracking-wider truncate max-w-[220px] block"
                        style={{ color: currentTheme.primaryColor }}
                      >
                        {restaurantName}
                      </span>
                      <div
                        className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider"
                        style={{
                          backgroundColor: `${currentTheme.primaryColor}15`,
                          color: currentTheme.primaryColor,
                        }}
                      >
                        {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                        <span>{t.tableNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center relative my-1">
                      <StylizedQRCode
                        value={qrUrl}
                        dotPattern={dotPattern}
                        eyePattern={eyePattern}
                        shape={shape}
                        color1={currentTheme.qrGradient.color1}
                        color2={currentTheme.qrGradient.color2}
                        excavateCenter={centerIcon !== 'none'}
                        className="w-[155px] h-[155px]"
                      />
                      {centerIcon !== 'none' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div
                            className="w-9 h-9 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-sm"
                            style={{ borderColor: currentTheme.primaryColor }}
                          >
                            {getCenterIconEmoji(centerIcon)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pb-1 space-y-0.5">
                      <div className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-700">
                        Touchless Ordering
                      </div>
                      <div className="text-[8px] font-mono text-zinc-500 truncate max-w-[200px]">
                        {cleanUrl}
                      </div>
                    </div>
                  </div>
                );
              }

              // 4. DEFAULT: SIGNATURE STANDEE (Brand - Image 3)
              return (
                <div
                  key={`print-${t.id}`}
                  className="p-8 rounded-3xl text-white flex flex-col items-center justify-between text-center relative overflow-hidden break-inside-avoid page-break-inside-avoid min-h-[500px]"
                  style={{
                    background: currentTheme.primaryColor,
                    backgroundImage: `linear-gradient(135deg, ${currentTheme.qrGradient.color1}, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
                    WebkitPrintColorAdjust: 'exact',
                    printColorAdjust: 'exact',
                  }}
                >
                  <div className="space-y-1 w-full relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/20 text-white font-black text-sm tracking-wider uppercase border border-white/30 mb-1">
                      {centerIcon !== 'none' && <span>{getCenterIconEmoji(centerIcon)}</span>}
                      <span>{t.tableNumber}</span>
                    </div>

                    <div className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                      WELCOME & DINE-IN
                    </div>

                    <h2 className="text-2xl font-black tracking-tight line-clamp-1">{restaurantName}</h2>
                    <p className="text-xs text-white/80 line-clamp-1">{branch.address || branch.name}</p>
                  </div>

                  <div className="my-4 p-4 bg-white rounded-3xl shadow-xl flex items-center justify-center relative">
                    <StylizedQRCode
                      value={qrUrl}
                      dotPattern={dotPattern}
                      eyePattern={eyePattern}
                      shape={shape}
                      color1={currentTheme.qrGradient.color1}
                      color2={currentTheme.qrGradient.color2}
                      excavateCenter={centerIcon !== 'none'}
                      className="w-[185px] h-[185px]"
                    />
                    {centerIcon !== 'none' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                          className="w-11 h-11 rounded-full bg-white border-2 shadow-sm flex items-center justify-center text-lg"
                          style={{ borderColor: currentTheme.primaryColor }}
                        >
                          {getCenterIconEmoji(centerIcon)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 relative z-10">
                    <div className="text-xs font-black uppercase tracking-widest text-white">
                      SCAN FOR DIGITAL MENU
                    </div>
                    <p className="text-[11px] text-white/90 font-medium">
                      Point your phone camera to browse & order
                    </p>
                    <p className="text-[10px] font-mono text-white/70 bg-black/20 px-2 py-0.5 rounded-md inline-block max-w-[260px] truncate">
                      {cleanUrl}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
