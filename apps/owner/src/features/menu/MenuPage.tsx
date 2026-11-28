import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Store,
  Sparkles,
  Globe,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button, ConfirmModal, toast } from '../../components/ui';
import { useRestaurants } from '../restaurants/hooks/useRestaurants';
import { useBranches } from '../branches/hooks/useBranches';
import { useActiveStore } from '../../store/useActiveStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { SUPPORTED_CURRENCIES } from '../../config/currencies.config';
import { useMenu } from './hooks/useMenu';
import { useRestaurantMatrix } from '../branches/hooks/useRestaurantMatrix';
import { CategoryModal } from './components/CategoryModal';
import { DishModal } from './components/DishModal';
import { BranchMatrixTable } from './components/BranchMatrixTable';
import { AiMenuImportModal } from './components/AiMenuImportModal';
import { TranslateMenuModal } from './components/TranslateMenuModal';
import { getMediaUrl, cn } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';
import { usePermissions } from '../../hooks/usePermissions';
import type { Category, Product } from './api/menu-api';

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeRestaurantId, setActiveRestaurantId } = useActiveStore();
  const { restaurants } = useRestaurants();
  const { branches } = useBranches();
  const { currentCurrency, formatPrice } = useCurrencyStore();
  const { can, isOwner } = usePermissions();

  // Mode View: 'catalog' (Master Brand Catalog) OR 'branch' (Branch Availability Matrix)
  const tabParam = searchParams.get('tab');
  const [viewMode, setViewMode] = useState<'catalog' | 'branch'>(
    tabParam === 'branch' ? 'branch' : 'catalog',
  );

  // Active Restaurant
  const urlRestaurantId = searchParams.get('restaurantId');
  const targetRestaurantId =
    urlRestaurantId || activeRestaurantId || (restaurants.length > 0 ? restaurants[0].id : '');

  const activeRestaurant =
    restaurants.find((r) => r.id === targetRestaurantId) || restaurants[0];
  const effectiveRestaurantId = activeRestaurant?.id || '';

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreviewDishId, setSelectedPreviewDishId] = useState<string | null>(null);
  const [defaultAddCategoryId, setDefaultAddCategoryId] = useState<string | undefined>(undefined);
  const [openActionDishId, setOpenActionDishId] = useState<string | null>(null);

  // Modals State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isAiImportModalOpen, setIsAiImportModalOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Product | null>(null);
  const [deletingDish, setDeletingDish] = useState<Product | null>(null);

  // Synchronize branch from URL if present
  useEffect(() => {
    if (tabParam === 'branch') {
      setViewMode('branch');
    }
  }, [tabParam]);

  // Fetch Categories & Dishes for active restaurant
  const {
    categories,
    products,
    isProductsLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    refetchProducts,
  } = useMenu(effectiveRestaurantId, {
    search: searchQuery || undefined,
  });

  // Filter and stably sort branches belonging to this active restaurant (oldest first, matching matrix columns)
  const restaurantBranches = branches
    .filter((b) => b.restaurantId === effectiveRestaurantId)
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  // Master product toggle across branches
  const { toggleMasterProductAvailability } = useRestaurantMatrix(effectiveRestaurantId);

  // Select initial preview dish if none selected
  useEffect(() => {
    if (products.length > 0 && !selectedPreviewDishId) {
      setSelectedPreviewDishId(products[0].id);
    }
  }, [products, selectedPreviewDishId]);

  const handleSelectRestaurant = (restaurantId: string) => {
    setSearchParams({ restaurantId, tab: viewMode });
    setActiveRestaurantId(restaurantId);
    setSearchQuery('');
  };

  const handleSwitchMode = (mode: 'catalog' | 'branch') => {
    setViewMode(mode);
    setSearchParams({ tab: mode, restaurantId: effectiveRestaurantId });
    if (mode === 'catalog') {
      refetchProducts();
    }
  };

  // Category handlers
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (data: { restaurantId: string; name: string; description?: string }) => {
    if (editingCategory) {
      await updateCategory({
        id: editingCategory.id,
        data: { name: data.name, description: data.description },
      });
      toast.success(`Category "${data.name}" updated!`, 'Saved');
    } else {
      await createCategory({
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.description,
      });
      toast.success(`Category "${data.name}" created!`, 'Created');
    }
    setIsCategoryModalOpen(false);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    await deleteCategory(deletingCategory.id);
    toast.success(`Category "${deletingCategory.name}" deleted.`, 'Deleted');
    setDeletingCategory(null);
  };

  // Dish handlers
  const handleOpenNewDish = (catId?: string) => {
    setEditingDish(null);
    setDefaultAddCategoryId(catId);
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (dish: Product) => {
    setEditingDish(dish);
    setDefaultAddCategoryId(undefined);
    setIsDishModalOpen(true);
  };

  const handleSaveDish = async (formData: FormData) => {
    if (editingDish) {
      await updateProduct({ id: editingDish.id, data: formData });
      await refetchProducts();
      toast.success(`Dish "${editingDish.name}" updated!`, 'Saved');
    } else {
      await createProduct(formData);
      await refetchProducts();
      toast.success('New dish added to catalog!', 'Created');
    }
    setIsDishModalOpen(false);
  };

  const handleConfirmDeleteDish = async () => {
    if (!deletingDish) return;
    await deleteProduct(deletingDish.id);
    toast.success(`Dish "${deletingDish.name}" deleted.`, 'Deleted');
    setDeletingDish(null);
  };

  // Stock filter in Master Catalog: 'all' | 'available' | 'sold_out'
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'sold_out'>('all');

  // Summary counts per dish across branches
  const totalDishes = products.length;
  let availableDishesCount = 0;
  let soldOutDishesCount = 0;

  products.forEach((dish) => {
    const branchProductsMap = new Map(
      (dish.branchProducts || []).map((bp) => [bp.branchId, bp]),
    );
    const inStock = restaurantBranches.filter((b) => {
      const bp = branchProductsMap.get(b.id);
      return bp ? bp.isAvailable : true;
    }).length;

    // A dish is considered fully available when all branches have it in stock (or no branches exist yet)
    if (restaurantBranches.length === 0 || inStock === restaurantBranches.length) {
      availableDishesCount++;
    } else {
      soldOutDishesCount++;
    }
  });

  // Currency resolution
  const brandCurrencyCode = activeRestaurant?.defaultCurrency || currentCurrency.code;
  const brandCurrencyObj =
    SUPPORTED_CURRENCIES.find((c) => c.code === brandCurrencyCode) || currentCurrency;

  return (
    <DashboardLayout
      branchCount={branches.length}
      restaurantCount={restaurants.length}
    >
      <div className="space-y-4">
        {/* Top Header matching Sample Image 1 & 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              Digital Menu
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Manage dishes and what each branch sells.
            </p>
          </div>

          {/* Brand Switcher Pills Container */}
          {restaurants.length > 0 && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-2/80 border border-border shadow-2xs">
              {restaurants.map((restaurant) => {
                const isSelected = activeRestaurant?.id === restaurant.id;
                const currency = restaurant.defaultCurrency || 'INR';

                return (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => handleSelectRestaurant(restaurant.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all select-none',
                      isSelected
                        ? 'bg-surface text-text font-bold shadow-xs border border-border dark:bg-zinc-800 dark:text-white dark:border-zinc-700'
                        : 'text-muted hover:text-text hover:bg-surface/50 border border-transparent',
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0 transition-colors',
                        isSelected
                          ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-muted/40',
                      )}
                    />
                    <span>{restaurant.name}</span>
                    <span
                      className={cn(
                        'text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors',
                        isSelected
                          ? 'bg-primary/15 text-primary font-bold'
                          : 'text-muted',
                      )}
                    >
                      ₹ {currency}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab Switcher with Underline Indicator */}
        <div className="flex items-center gap-6 border-b border-border text-sm font-semibold pt-1 overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            type="button"
            onClick={() => handleSwitchMode('catalog')}
            className={cn(
              'pb-2.5 flex items-center gap-2 cursor-pointer transition-colors relative shrink-0 whitespace-nowrap',
              viewMode === 'catalog'
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-muted hover:text-text',
            )}
          >
            <span>Master Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('branch')}
            className={cn(
              'pb-2.5 flex items-center gap-2 cursor-pointer transition-colors relative shrink-0 whitespace-nowrap',
              viewMode === 'branch'
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-muted hover:text-text',
            )}
          >
            <span>Branch Availability</span>
            {restaurantBranches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/15 text-primary font-bold">
                {restaurantBranches.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: MASTER CATALOG VIEW */}
        {viewMode === 'catalog' && (
          <div className="space-y-4">
            {/* Filter & Actions Bar */}
            <div className="flex flex-col gap-3 p-3.5 rounded-[12px] bg-surface border border-border">
              {/* Row 1: Search & Primary Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                {/* Search */}
                <div className="relative w-full md:flex-1 md:max-w-[260px] lg:max-w-[300px] h-9">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full pl-9 pr-3 text-xs bg-surface-2 border border-border rounded-[8px] text-text placeholder:text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                {can('menu', 'create') && (
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAiImportModalOpen(true)}
                      className="flex-1 sm:flex-initial justify-center h-9 px-3 rounded-[8px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Sparkles size={13} className="text-primary shrink-0" /> AI Menu Import
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTranslateModalOpen(true)}
                      className="flex-1 sm:flex-initial justify-center h-9 px-3 rounded-[8px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      title="Translate Menu into Regional Languages"
                    >
                      <Globe size={13} className="shrink-0" /> Translate Menu
                    </button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenNewDish()}
                      icon={<Plus size={14} />}
                      className="w-full sm:w-auto justify-center h-9 whitespace-nowrap shrink-0"
                    >
                      Add Dish
                    </Button>
                  </div>
                )}
              </div>

              {/* Row 2: Stock Counter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={cn(
                    'px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0',
                    stockFilter === 'all'
                      ? 'bg-surface-2 border border-border text-text font-bold shadow-2xs'
                      : 'text-muted hover:text-text border border-transparent',
                  )}
                >
                  {totalDishes} dishes
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('available')}
                  className={cn(
                    'px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
                    stockFilter === 'available'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15',
                  )}
                >
                  {availableDishesCount} available
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('sold_out')}
                  className={cn(
                    'px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0',
                    stockFilter === 'sold_out'
                      ? 'bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 shadow-2xs'
                      : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/15',
                  )}
                >
                  {soldOutDishesCount} sold out
                </button>
              </div>
            </div>

            {/* Categorized Dish Sections */}
            {isProductsLoading ? (
              <div className="p-12 text-center text-muted bg-surface rounded-[12px] border border-border">
                <p className="text-xs">Loading master dishes...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center bg-surface border border-dashed border-border rounded-[12px] space-y-3">
                <UtensilsCrossed size={24} className="mx-auto text-muted/60" />
                <div>
                  <h3 className="text-sm font-semibold text-text">No Categories Created</h3>
                  <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                    Create food categories (e.g. Starters, Main Dish) to organize your dishes.
                  </p>
                </div>
                {can('menu', 'create') && (
                  <Button variant="primary" size="sm" onClick={handleOpenNewCategory}>
                    + Create First Category
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {categories.map((cat) => {
                  const catProducts = products
                    .filter((p) => p.categoryId === cat.id)
                    .filter((dish) => {
                      if (stockFilter === 'all') return true;
                      const branchProductsMap = new Map(
                        (dish.branchProducts || []).map((bp) => [bp.branchId, bp]),
                      );
                      const inStock = restaurantBranches.filter((b) => {
                        const bp = branchProductsMap.get(b.id);
                        return bp ? bp.isAvailable : true;
                      }).length;
                      const isFullyAvailable =
                        restaurantBranches.length === 0 || inStock === restaurantBranches.length;
                      if (stockFilter === 'available') return isFullyAvailable;
                      if (stockFilter === 'sold_out') return !isFullyAvailable;
                      return true;
                    });

                  return (
                    <div key={cat.id} className="space-y-2">
                      {/* Category Section Header */}
                      <div className="flex items-center justify-between px-1 group/cathead">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                            {cat.name} · {catProducts.length}
                          </h3>
                          {/* Hover Edit & Delete Category */}
                          <div className="hidden group-hover/cathead:flex items-center gap-1">
                            {can('menu', 'edit') && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditCategory(cat)}
                                className="p-1 rounded text-muted hover:text-primary transition-colors cursor-pointer"
                                title="Edit Category"
                              >
                                <Pencil size={11} />
                              </button>
                            )}
                            {can('menu', 'delete') && (
                              <button
                                type="button"
                                onClick={() => setDeletingCategory(cat)}
                                className="p-1 rounded text-muted hover:text-danger transition-colors cursor-pointer"
                                title="Delete Category"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>

                        {can('menu', 'create') && (
                          <button
                            type="button"
                            onClick={() => handleOpenNewDish(cat.id)}
                            className="text-xs font-semibold text-[#c2410c] dark:text-orange-400 hover:underline cursor-pointer"
                          >
                            + Add to {cat.name}
                          </button>
                        )}
                      </div>

                      {/* Category Dishes List */}
                      {catProducts.length === 0 ? (
                        <div className="p-4 rounded-[10px] bg-surface-2/40 border border-dashed border-border text-center text-xs text-muted">
                          No dishes in {cat.name} yet.{' '}
                          {can('menu', 'create') && (
                            <button
                              type="button"
                              onClick={() => handleOpenNewDish(cat.id)}
                              className="text-[#c2410c] dark:text-orange-400 hover:underline font-semibold cursor-pointer"
                            >
                              Add one now
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {catProducts.map((dish) => {
                            const isSelected = selectedPreviewDishId === dish.id;
                            const imageSrc = getMediaUrl(dish.imageUrl);

                            // Compute branch stock dots
                            const branchProductsMap = new Map(
                              (dish.branchProducts || []).map((bp) => [bp.branchId, bp]),
                            );

                            let inStockCount = 0;
                            const branchStatuses = restaurantBranches.map((b) => {
                              const bp = branchProductsMap.get(b.id);
                              const isAvailable = bp ? bp.isAvailable : true;
                              if (isAvailable) inStockCount++;
                              return { branch: b, isAvailable };
                            });

                            const isAvailableMaster =
                              inStockCount > 0 || restaurantBranches.length === 0;

                            return (
                              <div
                                key={dish.id}
                                onClick={() => setSelectedPreviewDishId(dish.id)}
                                className={cn(
                                  'p-3 rounded-[12px] bg-surface border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group',
                                  isSelected
                                    ? 'border-l-4 border-l-[#c2410c] border-border shadow-xs'
                                    : 'border-border hover:border-border/80 hover:bg-surface-2/40',
                                )}
                              >
                                {/* Left: Food thumbnail + Name + Description */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-12 h-12 rounded-[10px] bg-amber-600 overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                                    {imageSrc ? (
                                      <img
                                        src={imageSrc}
                                        alt={dish.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span>{dish.name.slice(0, 1)}</span>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <h4 className="text-xs font-bold text-text truncate">
                                        {dish.name}
                                      </h4>
                                      {/* Veg green indicator badge */}
                                      <span
                                        className="w-3.5 h-3.5 border border-emerald-600 rounded-[3px] flex items-center justify-center shrink-0"
                                        title="Vegetarian"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                      </span>
                                    </div>
                                    {dish.description && (
                                      <p className="text-[11px] text-muted truncate max-w-md mt-0.5">
                                        {dish.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Right: Branch Dots + Price + Switch + Menu */}
                                <div
                                  className="flex items-center gap-4 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Branch Dots Indicator matching Sample Image 1 */}
                                  {restaurantBranches.length > 0 && (
                                    <div
                                      className="hidden sm:flex items-center gap-1.5"
                                      title={`${inStockCount} of ${restaurantBranches.length} branches in stock`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {branchStatuses.map((st, i) => (
                                          <span
                                            key={st.branch.id || i}
                                            className={cn(
                                              'w-2 h-2 rounded-full',
                                              st.isAvailable
                                                ? 'bg-emerald-600'
                                                : 'bg-neutral-300 dark:bg-neutral-700',
                                            )}
                                            title={`${st.branch.name}: ${st.isAvailable ? 'In Stock' : 'Out of Stock'}`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-[11px] text-muted font-mono font-bold">
                                        {inStockCount}/{restaurantBranches.length}
                                      </span>
                                    </div>
                                  )}

                                  {/* Base Price */}
                                  <span className="text-xs font-bold text-text font-mono">
                                    {brandCurrencyObj.symbol}
                                    {Number(dish.basePrice ?? dish.price ?? 0).toFixed(0)}
                                  </span>

                                  {/* Stock Switch Toggle */}
                                  <button
                                    type="button"
                                    disabled={!can('menu', 'toggleStock')}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!can('menu', 'toggleStock')) return;
                                      const nextState = !isAvailableMaster;
                                      const branchIds = restaurantBranches.map((b) => b.id);
                                      if (branchIds.length > 0) {
                                        await toggleMasterProductAvailability({
                                          productId: dish.id,
                                          isAvailable: nextState,
                                          branchIds,
                                        });
                                      }
                                    }}
                                    className={cn(
                                      'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                                      can('menu', 'toggleStock') ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                                      isAvailableMaster ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700',
                                    )}
                                    title={
                                      !can('menu', 'toggleStock')
                                        ? 'You do not have permission to change dish availability'
                                        : isAvailableMaster
                                        ? 'Click to mark sold out across all branches'
                                        : 'Click to mark in stock across all branches'
                                    }
                                  >
                                    <span
                                      className={cn(
                                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                                        isAvailableMaster ? 'translate-x-4' : 'translate-x-0',
                                      )}
                                    />
                                  </button>

                                  {/* 3-dots Menu Button */}
                                  {(can('menu', 'edit') || can('menu', 'delete')) && (
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOpenActionDishId(
                                            openActionDishId === dish.id ? null : dish.id,
                                          )
                                        }
                                        className="p-1 rounded-[6px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                                        title="Dish Actions"
                                      >
                                        <MoreHorizontal size={15} />
                                      </button>

                                      {/* Popover Action Menu */}
                                      {openActionDishId === dish.id && (
                                        <div className="absolute right-0 top-full mt-1 w-32 rounded-[8px] bg-surface border border-border shadow-lg py-1 z-30 text-xs">
                                          {can('menu', 'edit') && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setOpenActionDishId(null);
                                                handleOpenEditDish(dish);
                                              }}
                                              className="w-full text-left px-3 py-1.5 hover:bg-surface-2 flex items-center gap-2 text-text cursor-pointer"
                                            >
                                              <Pencil size={12} />
                                              <span>Edit Dish</span>
                                            </button>
                                          )}
                                          {can('menu', 'delete') && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setOpenActionDishId(null);
                                                setDeletingDish(dish);
                                              }}
                                              className="w-full text-left px-3 py-1.5 hover:bg-danger/10 text-danger flex items-center gap-2 cursor-pointer"
                                            >
                                              <Trash2 size={12} />
                                              <span>Delete Dish</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom explanatory note matching Sample Image 1 */}
            {restaurantBranches.length > 0 && (
              <p className="text-[11px] text-muted pt-2">
                The dots on each row show{' '}
                <span className="font-semibold text-text">
                  {restaurantBranches.map((b) => b.name).join(', ')}
                </span>{' '}
                in order (green = in stock).
              </p>
            )}
          </div>
        )}

        {/* TAB 2: BRANCH AVAILABILITY MATRIX VIEW */}
        {viewMode === 'branch' && (
          <div className="space-y-4">
            <BranchMatrixTable
              restaurantId={effectiveRestaurantId}
              onAddBranchClick={() => navigate(ROUTES.BRANCHES)}
            />
          </div>
        )}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        restaurants={restaurants}
        defaultRestaurantId={effectiveRestaurantId}
        restaurantId={effectiveRestaurantId}
        initialData={editingCategory}
        onSubmit={handleSaveCategory}
      />

      {/* Dish Modal */}
      <DishModal
        isOpen={isDishModalOpen}
        onClose={() => setIsDishModalOpen(false)}
        restaurants={restaurants}
        defaultRestaurantId={effectiveRestaurantId}
        defaultCategoryId={defaultAddCategoryId}
        categories={categories}
        branches={branches}
        initialData={editingDish}
        onSubmit={handleSaveDish}
        onBranchUpdated={refetchProducts}
      />

      {/* Confirm Delete Dish Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingDish)}
        onClose={() => setDeletingDish(null)}
        onConfirm={handleConfirmDeleteDish}
        title={`Delete "${deletingDish?.name}"?`}
        message="This will remove this dish from the master catalog and from all physical branches."
        confirmText="Delete Dish"
        variant="danger"
      />

      {/* Confirm Delete Category Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDeleteCategory}
        title={`Delete Category "${deletingCategory?.name}"?`}
        message="Are you sure you want to delete this category? Associated dishes will become uncategorized."
        confirmText="Delete Category"
        variant="danger"
      />
      {/* AI Menu Import Modal */}
      <AiMenuImportModal
        isOpen={isAiImportModalOpen}
        onClose={() => setIsAiImportModalOpen(false)}
        onSuccess={() => refetchProducts()}
        restaurants={restaurants}
        defaultRestaurantId={effectiveRestaurantId}
      />

      {/* Multilingual Menu Translation Modal */}
      <TranslateMenuModal
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
        restaurantId={effectiveRestaurantId}
        categories={categories}
        products={products}
        onTranslationComplete={() => refetchProducts()}
      />
    </DashboardLayout>
  );
};
