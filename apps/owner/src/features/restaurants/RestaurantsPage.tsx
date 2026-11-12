import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Utensils,
  Plus,
  Trash2,
  Pencil,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MoreHorizontal,
  Layers,
  AlertCircle,
  RefreshCw,
  X,
  Palette,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, ConfirmModal, toast } from '../../components/ui';
import { useRestaurants } from './hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { useActiveStore } from '../../store/useActiveStore';
import { RestaurantModal } from './components/RestaurantModal';
import { BranchModal } from '../branches/components/BranchModal';
import { InstagramQRModal } from '../branches/components/InstagramQRModal';
import { getMediaUrl, cn } from '../../lib/utils';
import { getCustomerStorefrontUrl } from '../../lib/urls';
import { ROUTES } from '../../constants/routes';
import type { Restaurant, Branch, CreateBranchInput } from '@instant-qr/shared-types';

export const RestaurantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveRestaurantId, setActiveBranchId } = useActiveStore();

  const {
    restaurants,
    isLoading,
    isError,
    error,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    isDeleting: isDeletingRestaurant,
  } = useRestaurants();

  const {
    createBranch,
    updateBranch,
    deleteBranch,
    isDeleting: isDeletingBranch,
  } = useBranches();

  // Modals state
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [deletingRestaurant, setDeletingRestaurant] = useState<Restaurant | null>(null);

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [targetRestaurantIdForNewBranch, setTargetRestaurantIdForNewBranch] = useState<string | null>(null);

  // QR Modal & copy link state
  const [qrModalBranch, setQrModalBranch] = useState<Branch | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Dropdown popover menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  // Aggregated totals
  const totalBranches = restaurants.reduce(
    (acc, r) => acc + (r.branches?.length ?? r._count?.branches ?? 0),
    0,
  );
  const totalDishes = restaurants.reduce(
    (acc, r) => acc + (r._count?.products ?? 0),
    0,
  );

  // Tile palette generator
  const getTileColor = (name: string, index: number) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('non-veg') || lower.includes('non veg')) return 'bg-[#8f241e] text-white';
    if (lower.includes('veg')) return 'bg-[#d97706] text-white';
    const palette = [
      'bg-[#8f241e] text-white',
      'bg-[#d97706] text-white',
      'bg-[#1e3a8a] text-white',
      'bg-[#064e3b] text-white',
      'bg-[#581c87] text-white',
      'bg-[#831843] text-white',
    ];
    return palette[index % palette.length];
  };

  // Handlers for Restaurant Concept
  const handleOpenCreateRestaurant = () => {
    setEditingRestaurant(null);
    setIsRestaurantModalOpen(true);
  };

  const handleOpenEditRestaurant = (restaurant: Restaurant) => {
    setActiveMenuId(null);
    setEditingRestaurant(restaurant);
    setIsRestaurantModalOpen(true);
  };

  const handleOpenCustomizeTheme = (restaurant: Restaurant) => {
    setActiveMenuId(null);
    navigate(`/restaurants/${restaurant.id}/theme`);
  };

  const handleSaveRestaurant = async (formData: FormData) => {
    if (editingRestaurant) {
      await updateRestaurant({ id: editingRestaurant.id, data: formData });
    } else {
      const created = await createRestaurant(formData);
      if (created?.id) {
        setActiveRestaurantId(created.id);
      }
    }
  };

  const handleConfirmDeleteRestaurant = async () => {
    if (!deletingRestaurant) return;
    try {
      await deleteRestaurant(deletingRestaurant.id);
      setDeletingRestaurant(null);
    } catch {
      // Error toast already triggered
    }
  };

  // Handlers for Branch
  const handleOpenAddBranch = (restaurantId: string) => {
    setTargetRestaurantIdForNewBranch(restaurantId);
    setEditingBranch(null);
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (branch: Branch) => {
    setActiveMenuId(null);
    setEditingBranch(branch);
    setTargetRestaurantIdForNewBranch(branch.restaurantId);
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (data: CreateBranchInput, branchId?: string) => {
    if (branchId) {
      await updateBranch({ id: branchId, data });
    } else {
      await createBranch(data);
    }
  };

  const handleConfirmDeleteBranch = async () => {
    if (!deletingBranch) return;
    try {
      await deleteBranch(deletingBranch.id);
      setDeletingBranch(null);
    } catch {
      // Error toast handled in hook
    }
  };

  const handleGoToMenuAndStock = (restaurantId: string, branchId: string) => {
    setActiveRestaurantId(restaurantId);
    setActiveBranchId(branchId);
    navigate(`${ROUTES.MENU}?restaurantId=${restaurantId}&branchId=${branchId}`);
  };

  const handleCopyUrl = (slug: string) => {
    const fullUrl = getCustomerStorefrontUrl(slug);
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    toast.success('Storefront link copied to clipboard!');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <DashboardLayout
      branchCount={totalBranches}
      restaurantCount={restaurants.length}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
              Restaurants &amp; Branches
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 font-medium">
              {restaurants.length} {restaurants.length === 1 ? 'concept' : 'concepts'} · {totalBranches} {totalBranches === 1 ? 'branch' : 'branches'} · {totalDishes} master {totalDishes === 1 ? 'dish' : 'dishes'}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreateRestaurant}
            icon={<Plus size={16} />}
          >
            New Restaurant
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-16 text-center text-muted flex flex-col items-center justify-center gap-3">
            <RefreshCw size={26} className="animate-spin text-primary" />
            <p className="text-xs font-medium">Loading restaurant concepts &amp; branches...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-2xl bg-danger/10 border border-danger/25 text-danger flex items-center gap-3">
            <AlertCircle size={22} className="shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Failed to load restaurant concepts</p>
              <p className="text-xs opacity-80">
                {(error as any)?.message || 'An unexpected error occurred while fetching data.'}
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && restaurants.length === 0 && (
          <div className="p-16 text-center rounded-2xl border border-dashed border-border bg-surface flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary-soft-text flex items-center justify-center">
              <Utensils size={28} />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-text">No Restaurant Concepts Yet</h3>
              <p className="text-xs text-muted leading-relaxed">
                Start by creating your first restaurant concept (e.g. "Ananda Pure Veg"). You can then
                upload brand logos, organize categories, and launch physical QR storefront branches.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreateRestaurant}
              icon={<Plus size={15} />}
            >
              Add First Concept
            </Button>
          </div>
        )}

        {/* Restaurant Cards List */}
        {!isLoading && !isError && restaurants.length > 0 && (
          <div className="space-y-6">
            {restaurants.map((restaurant, rIdx) => {
              const branchCount =
                restaurant.branches?.length ?? restaurant._count?.branches ?? 0;
              const categoryCount = restaurant._count?.categories ?? 0;
              const dishCount = restaurant._count?.products ?? 0;
              const branches = restaurant.branches ?? [];
              const logoSrc = getMediaUrl(restaurant.logoUrl);
              const initialLetter = (restaurant.name || 'R').charAt(0).toUpperCase();

              return (
                <div
                  key={restaurant.id}
                  className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden transition-all"
                >
                  {/* Top Row: Concept Details & Actions */}
                  <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar Letter Tile or Uploaded Brand Logo */}
                      {logoSrc ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border bg-white dark:bg-zinc-800/90 shrink-0 flex items-center justify-center shadow-xs p-1">
                          <img
                            src={logoSrc}
                            alt={restaurant.name}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs select-none',
                            getTileColor(restaurant.name, rIdx),
                          )}
                        >
                          {initialLetter}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-text truncate">
                            {restaurant.name}
                          </h2>
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-surface-2 text-muted text-xs font-mono border border-border/60">
                            /{restaurant.slug}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted mt-0.5 line-clamp-1">
                          {restaurant.description || 'Authentic dining cuisine and master menu catalog'}
                        </p>
                        <p className="text-xs text-muted/80 mt-1 font-medium">
                          {branchCount} {branchCount === 1 ? 'branch' : 'branches'} · {categoryCount} {categoryCount === 1 ? 'category' : 'categories'} · {dishCount} {dishCount === 1 ? 'dish' : 'dishes'}
                        </p>
                      </div>
                    </div>

                    {/* Concept Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0 relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAddBranch(restaurant.id)}
                        icon={<Plus size={14} />}
                      >
                        Add branch
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenCustomizeTheme(restaurant)}
                        icon={<Palette size={14} />}
                      >
                        Theme
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditRestaurant(restaurant)}
                      >
                        Edit
                      </Button>

                      {/* Dropdown Menu for Restaurant */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === `restaurant-${restaurant.id}`
                                ? null
                                : `restaurant-${restaurant.id}`,
                            )
                          }
                          className="h-8 w-8 rounded-[8px] border border-border bg-transparent hover:bg-surface-2 text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
                          title="More options"
                        >
                          <MoreHorizontal size={15} />
                        </button>

                        {activeMenuId === `restaurant-${restaurant.id}` && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1.5 w-48 bg-surface rounded-xl border border-border shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setActiveRestaurantId(restaurant.id);
                                navigate(`${ROUTES.MENU}?restaurantId=${restaurant.id}`);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 flex items-center gap-2 cursor-pointer"
                            >
                              <Layers size={14} className="text-muted" />
                              <span>View Master Menu</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenCustomizeTheme(restaurant);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 flex items-center gap-2 cursor-pointer"
                            >
                              <Palette size={14} className="text-muted" />
                              <span>Customize Theme</span>
                            </button>
                            <div className="border-t border-border my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeletingRestaurant(restaurant);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              <span>Delete Concept</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nested Branches List */}
                  <div className="border-t border-border/70 bg-surface-2/30 dark:bg-zinc-950/40 p-4 sm:p-5 space-y-3">
                    {branches.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted">
                        No branches configured for this concept yet. Click{' '}
                        <button
                          type="button"
                          onClick={() => handleOpenAddBranch(restaurant.id)}
                          className="font-semibold text-primary hover:underline cursor-pointer"
                        >
                          "+ Add branch"
                        </button>{' '}
                        to create your first physical QR storefront.
                      </div>
                    ) : (
                      branches.map((branch) => {
                        const fullUrl = getCustomerStorefrontUrl(branch.slug);

                        return (
                          <div
                            key={branch.id}
                            className="p-3.5 sm:px-4 sm:py-3.5 rounded-xl border border-border bg-surface dark:bg-zinc-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                          >
                            {/* Branch Name & Status */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-text truncate">
                                  {branch.name}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active
                                </span>
                              </div>
                              <p className="text-xs text-muted mt-1 truncate">
                                {[
                                  branch.address,
                                  branch.phone
                                    ? `${branch.countryCode ? `+${branch.countryCode} ` : ''}${branch.phone}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || 'Storefront location'}
                              </p>
                            </div>

                            {/* Branch Actions & URL Box */}
                            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 shrink-0">
                              {/* URL Pill with Copy, QR, External Link */}
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface-2/60 dark:bg-zinc-800/80 dark:border-zinc-700/80 text-xs font-mono text-muted dark:text-zinc-300">
                                <span className="truncate max-w-[170px] sm:max-w-[240px]">
                                  /r/{branch.slug}
                                </span>
                                <div className="flex items-center gap-1 border-l border-border dark:border-zinc-700/80 pl-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyUrl(branch.slug)}
                                    title="Copy storefront link"
                                    className="p-0.5 text-muted hover:text-text dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                  >
                                    {copiedSlug === branch.slug ? (
                                      <Check size={13} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQrModalBranch(branch)}
                                    title="Show QR Code"
                                    className="p-0.5 text-muted hover:text-text dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                  >
                                    <QrCode size={13} />
                                  </button>
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Open customer storefront"
                                    className="p-0.5 text-muted hover:text-text dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                </div>
                              </div>

                              {/* Orders Count Badge */}
                              <span className="text-xs text-muted whitespace-nowrap">
                                <strong className="text-text font-bold">0</strong> orders today
                              </span>

                              {/* Menu & Stock Button */}
                              <Button
                                variant="primary-soft"
                                size="sm"
                                onClick={() => handleGoToMenuAndStock(restaurant.id, branch.id)}
                                className="whitespace-nowrap font-semibold"
                              >
                                Menu &amp; stock
                              </Button>

                              {/* Edit Branch Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditBranch(branch)}
                                className="whitespace-nowrap"
                              >
                                Edit
                              </Button>

                              {/* Branch More Menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveMenuId(
                                      activeMenuId === `branch-${branch.id}`
                                        ? null
                                        : `branch-${branch.id}`,
                                    )
                                  }
                                  className="h-8 w-8 rounded-[8px] border border-border bg-transparent hover:bg-surface-2 text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
                                  title="Branch options"
                                >
                                  <MoreHorizontal size={14} />
                                </button>

                                {activeMenuId === `branch-${branch.id}` && (
                                  <div
                                    ref={menuRef}
                                    className="absolute right-0 top-full mt-1.5 w-44 bg-surface rounded-xl border border-border shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setQrModalBranch(branch);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 flex items-center gap-2 cursor-pointer"
                                    >
                                      <QrCode size={13} className="text-muted" />
                                      <span>Show QR Code</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        handleCopyUrl(branch.slug);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-text hover:bg-surface-2 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Copy size={13} className="text-muted" />
                                      <span>Copy Link</span>
                                    </button>
                                    <div className="border-t border-border my-1" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setDeletingBranch(branch);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                      <span>Delete Branch</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footnote text matching the sample mockup */}
        <p className="text-xs text-muted/80 mt-6 select-none">
          Sample data (the Anna Nagar branch is invented). Uploaded brand logos replace the letter tiles.
        </p>
      </div>

      {/* Instagram-Style Branded Stand QR Modal */}
      <InstagramQRModal
        branch={qrModalBranch}
        restaurant={
          qrModalBranch
            ? restaurants.find((r) => r.id === qrModalBranch.restaurantId) || null
            : null
        }
        isOpen={Boolean(qrModalBranch)}
        onClose={() => setQrModalBranch(null)}
      />

      {/* Restaurant Create / Edit Modal (with Logo Upload) */}
      <RestaurantModal
        isOpen={isRestaurantModalOpen}
        onClose={() => setIsRestaurantModalOpen(false)}
        restaurant={editingRestaurant}
        onSubmit={handleSaveRestaurant}
      />

      {/* Branch Create / Edit Modal */}
      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => {
          setIsBranchModalOpen(false);
          setEditingBranch(null);
          setTargetRestaurantIdForNewBranch(null);
        }}
        initialData={editingBranch}
        defaultRestaurantId={targetRestaurantIdForNewBranch}
        onSubmitBranch={handleSaveBranch}
      />

      {/* Delete Restaurant Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingRestaurant)}
        onClose={() => setDeletingRestaurant(null)}
        onConfirm={handleConfirmDeleteRestaurant}
        title={`Delete "${deletingRestaurant?.name}"?`}
        message={`Are you sure you want to delete this restaurant concept? All associated branches, menu categories, and product items will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Concept"
        variant="danger"
        isLoading={isDeletingRestaurant}
      />

      {/* Delete Branch Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingBranch)}
        onClose={() => setDeletingBranch(null)}
        onConfirm={handleConfirmDeleteBranch}
        title={`Delete "${deletingBranch?.name}"?`}
        message={`Are you sure you want to delete this branch? All QR links and storefront configurations for this location will be deactivated.`}
        confirmText="Delete Branch"
        variant="danger"
        isLoading={isDeletingBranch}
      />
    </DashboardLayout>
  );
};
