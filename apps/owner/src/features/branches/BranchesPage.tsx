import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Store,
  MapPin,
  Phone,
  Copy,
  Check,
  Plus,
  Trash2,
  Pencil,
  Utensils,
  UtensilsCrossed,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  QrCode,
  Search,
  LayoutList,
  LayoutGrid,
  X,
  Building2,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, ConfirmModal } from '../../components/ui';
import { useBranches } from './hooks/useBranches';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useActiveStore } from '../../store/useActiveStore';
import { BranchModal } from './components/BranchModal';
import { InstagramQRModal } from './components/InstagramQRModal';
import { TableQrModal } from './components/TableQrModal';
import {
  getCustomerStorefrontUrl,
  getEncryptedStorefrontUrl,
  fetchEncryptedQrTokens,
} from '../../lib/urls';
import { getMediaUrl, cn } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';
import { usePermissions } from '../../hooks/usePermissions';
import type { Branch, CreateBranchInput } from '@instant-qr/shared-types';

export const BranchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeRestaurantId, setActiveRestaurantId } = useActiveStore();
  const { restaurants } = useRestaurants();
  const { can, isBranchAllowed } = usePermissions();

  // Selected restaurant filter from URL or fallback to activeRestaurantId
  const urlRestaurantId = searchParams.get('restaurantId');
  const selectedRestaurantId = urlRestaurantId !== null ? urlRestaurantId : activeRestaurantId;

  // View mode: 'grid' cards vs 'table' spreadsheet
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all branches owned by the user
  const {
    branches: allBranches,
    isLoading,
    isError,
    error,
    refetch,
    createBranch,
    updateBranch,
    deleteBranch,
    isDeleting,
  } = useBranches();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [qrModalBranch, setQrModalBranch] = useState<Branch | null>(null);
  const [qrModalTableNumber, setQrModalTableNumber] = useState<string | null>(null);
  const [tableQrBranch, setTableQrBranch] = useState<Branch | null>(null);
  const [encryptedBranchTokens, setEncryptedBranchTokens] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!allBranches.length) return;
    let cancelled = false;
    Promise.all(
      allBranches.map(async (b) => {
        try {
          const res = await fetchEncryptedQrTokens(b.slug);
          return [b.slug, res.baseToken] as const;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const entry of entries) {
        if (entry && entry[1]) {
          map[entry[0]] = entry[1];
        }
      }
      setEncryptedBranchTokens(map);
    });
    return () => {
      cancelled = true;
    };
  }, [allBranches]);

  const getBranchStorefrontHref = (slug: string) => {
    const token = encryptedBranchTokens[slug];
    return token ? getEncryptedStorefrontUrl(token) : getCustomerStorefrontUrl(slug);
  };

  const getBranchDisplayPath = (slug: string) => {
    const token = encryptedBranchTokens[slug];
    return token ? `/s/${token}` : `/r/${slug}`;
  };

  const handleCopyUrl = (slug: string) => {
    const fullUrl = getBranchStorefrontHref(slug);
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Find active restaurant if filtered
  const activeRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  // Filter branches based on selected concept and allowed branch permissions
  const brandFilteredBranches = (
    activeRestaurant
      ? allBranches.filter((b) => b.restaurantId === activeRestaurant.id)
      : allBranches
  ).filter((b) => isBranchAllowed(b.id));

  // Search filter
  const displayedBranches = brandFilteredBranches.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.address && b.address.toLowerCase().includes(q))
    );
  });

  const handleSelectFilter = (restaurantId: string | null) => {
    if (restaurantId) {
      setSearchParams({ restaurantId });
      setActiveRestaurantId(restaurantId);
    } else {
      setSearchParams({});
      setActiveRestaurantId(null);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleSaveBranch = async (data: CreateBranchInput, id?: string) => {
    if (id) {
      await updateBranch({ id, data });
    } else {
      await createBranch(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBranch) return;
    try {
      await deleteBranch(deletingBranch.id);
      setDeletingBranch(null);
    } catch {
      // Error toast is handled by useBranches hook
    }
  };

  return (
    <DashboardLayout
      onNewBranchClick={handleOpenCreateModal}
      branchCount={allBranches.length}
      restaurantCount={restaurants.length}
    >
      <div className="space-y-4">
        {/* Clean Two-Row Header & Filter Toolbar */}
        <div className="p-3.5 sm:p-4 rounded-[12px] bg-surface border border-border shadow-xs space-y-3">
          {/* Row 1: Title + Add Branch Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-[8px] bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0 shadow-xs">
                <Store size={17} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-text leading-tight">
                    Branches &amp; Outlets
                  </h1>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-surface-2 text-muted font-bold">
                    {displayedBranches.length}
                  </span>
                </div>
                <p className="text-[11px] text-muted">
                  Physical restaurant storefronts &amp; digital QR menus
                </p>
              </div>
            </div>

            {can('branches', 'create') && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={handleOpenCreateModal}
                className="whitespace-nowrap shrink-0 w-full sm:w-auto justify-center"
              >
                Add Branch
              </Button>
            )}
          </div>

          {/* Row 2: Brand Filter Dropdown + Search & View Switcher */}
          <div className="pt-3 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Brand Filter Dropdown (scales cleanly for 10+ brands) */}
            {restaurants.length > 0 ? (
              <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-[8px] px-3 h-9 w-full md:w-[230px] min-w-0">
                <Utensils size={14} className="text-primary shrink-0" />
                <span className="text-[11px] font-bold text-muted uppercase shrink-0 leading-none">
                  Brand:
                </span>
                <select
                  aria-label="Filter by Brand"
                  value={selectedRestaurantId || 'ALL'}
                  onChange={(e) =>
                    handleSelectFilter(e.target.value === 'ALL' ? null : e.target.value)
                  }
                  className="bg-transparent border-none text-xs font-semibold text-text focus:outline-none cursor-pointer flex-1 min-w-0 truncate h-full"
                >
                  <option value="ALL" className="bg-surface text-text">
                    All Brands ({allBranches.length})
                  </option>
                  {restaurants.map((restaurant) => {
                    const count = allBranches.filter((b) => b.restaurantId === restaurant.id).length;
                    return (
                      <option
                        key={restaurant.id}
                        value={restaurant.id}
                        className="bg-surface text-text"
                      >
                        {restaurant.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div />
            )}

            {/* Search & View Mode Toggle */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              {/* Search Input */}
              <div className="relative flex-1 md:w-[220px] min-w-0 h-9">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-8 pr-3 text-xs bg-surface-2 border border-border rounded-[8px] placeholder:text-muted/60 focus:outline-none focus:border-primary text-text"
                />
              </div>

              {/* View Mode Toggle: Grid vs Table */}
              <div className="flex items-center p-0.5 rounded-[8px] bg-surface-2 border border-border h-9 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'h-full px-2.5 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium',
                    viewMode === 'grid'
                      ? 'bg-surface text-text shadow-xs font-semibold'
                      : 'text-muted hover:text-text'
                  )}
                  title="Grid Cards View"
                >
                  <LayoutGrid size={13} />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'h-full px-2.5 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium',
                    viewMode === 'table'
                      ? 'bg-surface text-text shadow-xs font-semibold'
                      : 'text-muted hover:text-text'
                  )}
                  title="Compact Table View"
                >
                  <LayoutList size={13} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error State Banner with Retry */}
        {isError && (
          <div className="p-3.5 rounded-[10px] bg-danger/10 border border-danger/25 text-danger flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>
                {(error as any)?.message || 'Failed to load branches. Please try again.'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={12} />}
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Content Section: Loading vs Empty vs Grid vs Table */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-48 bg-surface rounded-[12px] border border-border animate-pulse"
              />
            ))}
          </div>
        ) : displayedBranches.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center bg-surface border border-dashed border-border rounded-[12px] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary-soft text-primary-soft-text flex items-center justify-center">
              <Store size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text">No branches found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                {searchQuery
                  ? `No branches match "${searchQuery}".`
                  : activeRestaurant
                    ? `There are no branches under "${activeRestaurant.name}" yet. Click below to add the first location.`
                    : 'Get started by creating your first restaurant branch location.'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              {can('branches', 'create') && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={handleOpenCreateModal}
                >
                  {activeRestaurant ? `Add Branch for ${activeRestaurant.name}` : 'Add First Branch'}
                </Button>
              )}
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* High-Density Modern Branch Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayedBranches.map((branch) => {
              const parentConcept =
                branch.restaurant ||
                restaurants.find((r) => r.id === branch.restaurantId);
              const conceptLogo = parentConcept ? getMediaUrl(parentConcept.logoUrl) : null;
              const isCrossCurrency =
                parentConcept?.defaultCurrency &&
                branch.currency &&
                branch.currency !== parentConcept.defaultCurrency;

              return (
                <div
                  key={branch.id}
                  className="bg-surface border border-border rounded-[12px] overflow-hidden flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-xs group"
                >
                  <div className="p-4 space-y-3">
                    {/* Top: Branch Title & Brand Tag */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="text-sm font-bold text-text truncate">
                            {branch.name}
                          </h2>
                          {parentConcept && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-soft text-primary-soft-text border border-primary/20 shrink-0 flex items-center gap-1">
                              {conceptLogo && (
                                <img
                                  src={conceptLogo}
                                  alt={parentConcept.name}
                                  className="w-3 h-3 rounded-[2px] object-cover"
                                />
                              )}
                              <span>{parentConcept.name}</span>
                            </span>
                          )}
                        </div>

                        {/* Status + Currency badges */}
                        <div className="flex items-center gap-2 text-[11px] font-medium mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                            <span>Active Storefront</span>
                          </span>
                          <span className="text-muted/60">•</span>
                          <span className="font-mono text-text bg-surface-2 px-1.5 py-0.2 rounded border border-border text-[10px] font-bold">
                            {branch.currency || 'INR'}
                          </span>
                          {isCrossCurrency && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              Cross-Currency
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Store Icon */}
                      <div className="w-8 h-8 rounded-[8px] bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0">
                        <Store size={15} />
                      </div>
                    </div>

                    {/* Address & Phone */}
                    <div className="space-y-1.5 text-xs text-muted">
                      <div className="flex items-start gap-1.5">
                        <MapPin size={13} className="shrink-0 mt-0.5 text-muted/70" />
                        <span className="truncate">
                          {branch.address || 'No physical address configured'}
                        </span>
                      </div>

                      {branch.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="shrink-0 text-muted/70" />
                          <span>
                            {branch.countryCode ? `+${branch.countryCode} ` : ''}
                            {branch.phone}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Storefront Link Box */}
                    <div className="p-2 rounded-[8px] bg-surface-2 border border-border flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-primary font-semibold truncate text-[11px]">
                          {getBranchDisplayPath(branch.slug)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(branch.slug)}
                          title="Copy Storefront URL"
                          className="p-1 rounded text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                        >
                          {copiedSlug === branch.slug ? (
                            <Check size={13} className="text-success" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQrModalBranch(branch)}
                          title="Preview QR Code"
                          className="p-1 rounded text-muted hover:text-primary hover:bg-surface transition-colors cursor-pointer"
                        >
                          <QrCode size={13} />
                        </button>
                        <a
                          href={getBranchStorefrontHref(branch.slug)}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Storefront Menu"
                          className="p-1 rounded text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-2.5 sm:px-4 py-2.5 bg-surface-2/60 border-t border-border flex items-center justify-between gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => navigate(`${ROUTES.MENU}?tab=branch&branchId=${branch.id}`)}
                        className="px-1.5 sm:px-2.5 h-7 sm:h-8 rounded-[6px] bg-surface border border-border hover:border-primary/40 text-[11px] sm:text-xs font-semibold text-text flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                      >
                        <UtensilsCrossed size={11} className="text-primary shrink-0 sm:w-3 sm:h-3" />
                        <span>Stock &amp; Menu</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTableQrBranch(branch)}
                        className="px-1.5 sm:px-2.5 h-7 sm:h-8 rounded-[6px] bg-primary/10 border border-primary/20 hover:bg-primary/20 text-[11px] sm:text-xs font-bold text-primary flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        title="Download or Print Table QR Codes"
                      >
                        <QrCode size={11} className="shrink-0 sm:w-3 sm:h-3" />
                        <span>Table QRs</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {can('branches', 'edit') && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(branch)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] border border-border bg-surface text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="Edit Branch Settings"
                        >
                          <Pencil size={12} />
                        </button>
                      )}

                      {can('branches', 'delete') && (
                        <button
                          type="button"
                          onClick={() => setDeletingBranch(branch)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-[6px] border border-border bg-surface text-muted hover:text-danger hover:border-danger/30 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          title="Delete Branch"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* High-Density Table View */
          <div className="bg-surface border border-border rounded-[12px] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-2/80 border-b border-border text-muted uppercase tracking-wider text-[11px] font-semibold">
                    <th className="py-2.5 px-4 min-w-[200px]">Branch Location</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Concept Brand</th>
                    <th className="py-2.5 px-3 min-w-[90px]">Currency</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Customer QR URL</th>
                    <th className="py-2.5 px-4 min-w-[140px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayedBranches.map((branch) => {
                    const parentConcept =
                      branch.restaurant ||
                      restaurants.find((r) => r.id === branch.restaurantId);
                    const conceptLogo = parentConcept ? getMediaUrl(parentConcept.logoUrl) : null;

                    return (
                      <tr key={branch.id} className="hover:bg-surface-2/40 transition-colors group">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-[6px] bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0">
                              <Store size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-text truncate">{branch.name}</p>
                              <p className="text-[11px] text-muted truncate max-w-[240px]">
                                {branch.address || 'No address set'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {parentConcept ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-surface-2 border border-border text-[11px] font-medium text-text">
                              {conceptLogo && (
                                <img
                                  src={conceptLogo}
                                  alt={parentConcept.name}
                                  className="w-3 h-3 rounded-[2px] object-cover"
                                />
                              )}
                              <span>{parentConcept.name}</span>
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-mono text-text font-bold bg-surface-2 px-1.5 py-0.5 rounded border border-border text-[11px]">
                            {branch.currency || 'INR'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-primary text-[11px] font-medium truncate max-w-[140px]">
                              {getBranchDisplayPath(branch.slug)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(branch.slug)}
                              className="p-1 rounded text-muted hover:text-text cursor-pointer"
                              title="Copy link"
                            >
                              {copiedSlug === branch.slug ? (
                                <Check size={12} className="text-success" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setQrModalBranch(branch)}
                              className="p-1 rounded text-muted hover:text-primary cursor-pointer"
                              title="QR Code"
                            >
                              <QrCode size={12} />
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`${ROUTES.MENU}?tab=branch&branchId=${branch.id}`)
                              }
                              className="px-2 py-1 rounded-[6px] bg-surface border border-border hover:border-primary/40 text-xs font-semibold text-text flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <UtensilsCrossed size={12} className="text-primary" />
                              <span>Stock</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTableQrBranch(branch)}
                              className="px-2 py-1 rounded-[6px] bg-primary/10 border border-primary/20 hover:bg-primary/20 text-xs font-bold text-primary flex items-center gap-1 transition-colors cursor-pointer"
                              title="Download or Print Table QR Codes"
                            >
                              <QrCode size={12} />
                              <span>Tables</span>
                            </button>
                            {can('branches', 'edit') && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(branch)}
                                className="p-1.5 rounded-[6px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                                title="Edit branch"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            {can('branches', 'delete') && (
                              <button
                                type="button"
                                onClick={() => setDeletingBranch(branch)}
                                className="p-1.5 rounded-[6px] text-muted hover:text-danger hover:bg-surface-2 transition-colors cursor-pointer"
                                title="Delete branch"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Storefront QR Studio Modal */}
      <InstagramQRModal
        branch={qrModalBranch}
        restaurant={
          activeRestaurant ||
          (qrModalBranch ? restaurants.find((r) => r.id === qrModalBranch.restaurantId) : null)
        }
        isOpen={Boolean(qrModalBranch)}
        onClose={() => {
          setQrModalBranch(null);
          setQrModalTableNumber(null);
        }}
        initialTableNumber={qrModalTableNumber}
      />

      {/* Unique Table QR Codes Generation & Print Modal */}
      {tableQrBranch && (
        <TableQrModal
          isOpen={Boolean(tableQrBranch)}
          onClose={() => setTableQrBranch(null)}
          branch={tableQrBranch}
          onOpenStudio={(tableNumber) => {
            setQrModalBranch(tableQrBranch);
            setQrModalTableNumber(tableNumber || null);
            setTableQrBranch(null);
          }}
        />
      )}

      {/* Create / Edit Branch Modal */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitBranch={handleSaveBranch}
        initialData={editingBranch}
        defaultRestaurantId={activeRestaurant ? activeRestaurant.id : (restaurants[0]?.id || '')}
      />

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingBranch)}
        onClose={() => setDeletingBranch(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Restaurant Branch?"
        message={`Are you sure you want to delete branch "${deletingBranch?.name}"? Its public customer QR code and local stock records will be removed.`}
        confirmText="Delete Branch"
        variant="danger"
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
};
