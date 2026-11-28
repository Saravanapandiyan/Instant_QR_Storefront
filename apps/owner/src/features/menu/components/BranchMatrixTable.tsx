import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  UtensilsCrossed,
  Check,
  X,
  Edit2,
  ChevronDown,
} from 'lucide-react';
import { useRestaurantMatrix } from '../../branches/hooks/useRestaurantMatrix';
import { useCurrencyStore } from '../../../store/useCurrencyStore';
import { usePermissions } from '../../../hooks/usePermissions';
import { getMediaUrl, cn } from '../../../lib/utils';
import { Button } from '../../../components/ui';

interface BranchMatrixTableProps {
  restaurantId: string;
  onAddBranchClick: () => void;
}

export const BranchMatrixTable: React.FC<BranchMatrixTableProps> = ({
  restaurantId,
  onAddBranchClick,
}) => {
  const { matrix, isLoading, isError, error, refetch, toggleAvailability, updateOverride } =
    useRestaurantMatrix(restaurantId);
  const { formatPrice } = useCurrencyStore();
  const { can } = usePermissions();

  const canToggleStock = can('menu', 'toggleStock');
  const canEditPrice = can('menu', 'edit');
  const canCreateBranch = can('branches', 'create');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'out_of_stock' | 'price_overrides'>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Checkbox multi-select state
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [isBulkActing, setIsBulkActing] = useState(false);
  const [bulkPriceModalOpen, setBulkPriceModalOpen] = useState(false);
  const [bulkPriceValue, setBulkPriceValue] = useState('');

  // Inline price editing
  const [editingCell, setEditingCell] = useState<{ branchId: string; productId: string } | null>(
    null,
  );
  const [tempPrice, setTempPrice] = useState('');

  if (isLoading) {
    return (
      <div className="p-16 text-center text-muted flex flex-col items-center justify-center gap-2 bg-surface rounded-[12px] border border-border">
        <RefreshCw size={24} className="animate-spin text-primary" />
        <p className="text-xs font-medium">Loading multi-branch pricing & stock matrix...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-5 rounded-[12px] bg-danger/10 border border-danger/25 text-danger flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span>{(error as any)?.message || 'Failed to load branch matrix.'}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const branches = matrix?.branches || [];
  const categories = matrix?.categories || [];
  const products = matrix?.products || [];
  const brandCurrency = matrix?.defaultCurrency || 'INR';

  if (branches.length === 0) {
    return (
      <div className="p-12 text-center bg-surface border border-dashed border-border rounded-[12px] space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary-soft text-primary-soft-text flex items-center justify-center">
          <Store size={22} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text">No Branches Created for This Brand</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1">
            Create physical branches to manage live stock availability and local price overrides across locations.
          </p>
        </div>
        {canCreateBranch && (
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={onAddBranchClick}>
              + Add First Branch Location
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Filtered branches for display if user picks a specific branch
  const displayedBranches =
    selectedBranchFilter === 'all'
      ? branches
      : branches.filter((b: any) => b.id === selectedBranchFilter);

  // Compute filtered products based on search, category, and status filters
  const filteredProducts = products.filter((p: any) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !selectedCategoryFilter || p.categoryId === selectedCategoryFilter;

    // Check status against currently displayed branch(es)
    const activeBranchIds = new Set(displayedBranches.map((b: any) => b.id));
    const targetBranchProducts = (p.branchProducts || []).filter((bp: any) =>
      activeBranchIds.has(bp.branchId),
    );

    let matchesStatus = true;
    if (statusFilter === 'out_of_stock') {
      // Dish is out of stock in at least one of the displayed branches
      matchesStatus = targetBranchProducts.some((bp: any) => bp.isAvailable === false);
    } else if (statusFilter === 'price_overrides') {
      // Dish has a custom price override in at least one of the displayed branches
      matchesStatus = targetBranchProducts.some(
        (bp: any) => bp.priceOverride !== null && bp.priceOverride !== undefined,
      );
    }

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Calculate in-stock count per branch
  const branchStockCounts: Record<string, number> = {};
  branches.forEach((b: any) => {
    let count = 0;
    products.forEach((p: any) => {
      const bp = (p.branchProducts || []).find((x: any) => x.branchId === b.id);
      if (!bp || bp.isAvailable) count++;
    });
    branchStockCounts[b.id] = count;
  });

  // Multi-select handlers
  const handleToggleSelectAll = () => {
    if (selectedDishIds.length === filteredProducts.length) {
      setSelectedDishIds([]);
    } else {
      setSelectedDishIds(filteredProducts.map((p: any) => p.id));
    }
  };

  const handleToggleSelectDish = (id: string) => {
    setSelectedDishIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Bulk actions
  const handleBulkMarkStock = async (isAvailable: boolean) => {
    if (selectedDishIds.length === 0 || isBulkActing) return;
    setIsBulkActing(true);
    try {
      const targetBranches =
        selectedBranchFilter === 'all' ? branches : displayedBranches;

      const promises: Promise<any>[] = [];
      for (const branch of targetBranches) {
        for (const productId of selectedDishIds) {
          promises.push(
            updateOverride({
              branchId: branch.id,
              productId,
              data: { isAvailable },
            }),
          );
        }
      }
      await Promise.all(promises);
      setSelectedDishIds([]);
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkSetPrice = async () => {
    if (selectedDishIds.length === 0 || isBulkActing) return;
    const cleanPrice = bulkPriceValue.trim() ? Number(bulkPriceValue) : null;
    setIsBulkActing(true);
    try {
      const targetBranches =
        selectedBranchFilter === 'all' ? branches : displayedBranches;

      const promises: Promise<any>[] = [];
      for (const branch of targetBranches) {
        for (const productId of selectedDishIds) {
          promises.push(
            updateOverride({
              branchId: branch.id,
              productId,
              data: { priceOverride: cleanPrice },
            }),
          );
        }
      }
      await Promise.all(promises);
      setSelectedDishIds([]);
      setBulkPriceModalOpen(false);
      setBulkPriceValue('');
    } finally {
      setIsBulkActing(false);
    }
  };

  // Inline price save
  const handleSavePrice = async (branchId: string, productId: string) => {
    const num = tempPrice.trim() ? Number(tempPrice) : null;
    await updateOverride({
      branchId,
      productId,
      data: { priceOverride: num },
    });
    setEditingCell(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Filter Toolbar */}
      <div className="flex flex-col gap-2.5 p-3.5 rounded-[12px] bg-surface border border-border text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* Search */}
          <div className="relative w-full sm:flex-1 sm:min-w-0 shrink-0 h-9">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Filter dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full pl-8 pr-3 text-xs bg-surface-2 border border-border rounded-[8px] text-text placeholder:text-muted focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category Dropdown */}
          <select
            aria-label="Filter by category"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-[8px] border border-border bg-surface-2 text-text text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer w-full sm:w-[170px]"
          >
            <option value="">All categories</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Branch Filter Dropdown */}
          <select
            aria-label="Filter by branch"
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="h-9 px-3 rounded-[8px] border border-border bg-surface-2 text-text text-xs font-semibold focus:outline-none focus:border-primary cursor-pointer w-full sm:w-[190px]"
          >
            <option value="all">All branches ({branches.length})</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center pt-2 border-t border-border/60">
          <div className="inline-flex items-center p-0.5 rounded-[8px] bg-surface-2 border border-border h-9 overflow-x-auto scrollbar-none max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                'h-full px-3 rounded-[6px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0',
                statusFilter === 'all'
                  ? 'bg-surface text-text font-bold shadow-2xs border border-border'
                  : 'text-muted hover:text-text',
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('out_of_stock')}
              className={cn(
                'h-full px-3 rounded-[6px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0',
                statusFilter === 'out_of_stock'
                  ? 'bg-surface text-text font-bold shadow-2xs border border-border'
                  : 'text-muted hover:text-text',
              )}
            >
              Out of stock
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('price_overrides')}
              className={cn(
                'h-full px-3 rounded-[6px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0',
                statusFilter === 'price_overrides'
                  ? 'bg-surface text-text font-bold shadow-2xs border border-border'
                  : 'text-muted hover:text-text',
              )}
            >
              Price overrides
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bulk Selection Bar (Shown when dishes are selected) */}
      {selectedDishIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-[10px] bg-primary-soft border border-primary/25 text-xs animate-in fade-in">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-primary-soft-text">
              {selectedDishIds.length} dishes selected
            </span>
            <div className="flex items-center gap-2">
              {canToggleStock && (
                <>
                  <button
                    type="button"
                    onClick={() => handleBulkMarkStock(true)}
                    disabled={isBulkActing}
                    className="px-3 py-1.5 rounded-[6px] bg-primary text-on-primary font-semibold hover:bg-primary-hover transition-colors cursor-pointer shadow-2xs"
                  >
                    Mark in stock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkMarkStock(false)}
                    disabled={isBulkActing}
                    className="px-3 py-1.5 rounded-[6px] bg-surface border border-border text-text font-semibold hover:bg-surface-2 transition-colors cursor-pointer shadow-2xs"
                  >
                    Mark out of stock
                  </button>
                </>
              )}
              {canEditPrice && (
                <button
                  type="button"
                  onClick={() => setBulkPriceModalOpen(true)}
                  disabled={isBulkActing}
                  className="px-3 py-1.5 rounded-[6px] bg-surface border border-border text-text font-semibold hover:bg-surface-2 transition-colors cursor-pointer shadow-2xs"
                >
                  Set price override
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDishIds([])}
            className="text-xs text-primary hover:underline font-semibold cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* 3. High-Fidelity Spreadsheet Matrix Table */}
      <div className="bg-surface border border-border rounded-[12px] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-2/90 border-b border-border text-muted uppercase tracking-wider text-[11px] font-semibold">
                {/* Select All Checkbox + DISH */}
                <th className="py-3 px-4 min-w-[220px]">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        selectedDishIds.length === filteredProducts.length
                      }
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-primary border-border focus:ring-0 cursor-pointer"
                    />
                    <span>DISH</span>
                  </div>
                </th>

                {/* CATEGORY */}
                <th className="py-3 px-3 min-w-[120px]">CATEGORY</th>

                {/* Branch Columns with in-stock counts */}
                {displayedBranches.map((b: any) => {
                  const inStock = branchStockCounts[b.id] ?? 0;
                  return (
                    <th key={b.id} className="py-3 px-4 min-w-[180px] border-l border-border">
                      <div className="flex flex-col">
                        <span className="text-text font-bold text-xs truncate max-w-[170px]">
                          {b.name.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted font-normal lowercase">
                          {inStock} of {products.length} in stock
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={2 + displayedBranches.length} className="p-12 text-center text-muted">
                    <UtensilsCrossed size={22} className="mx-auto mb-2 opacity-40" />
                    No dishes found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((dish: any) => {
                  const isChecked = selectedDishIds.includes(dish.id);
                  const imageSrc = getMediaUrl(dish.imageUrl);
                  const branchProductsMap = new Map<string, any>(
                    (dish.branchProducts || []).map((bp: any) => [bp.branchId, bp]),
                  );

                  return (
                    <tr
                      key={dish.id}
                      className={cn(
                        'hover:bg-surface-2/40 transition-colors',
                        isChecked ? 'bg-amber-500/5' : '',
                      )}
                    >
                      {/* Checkbox + DISH Column */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectDish(dish.id)}
                            className="w-4 h-4 rounded text-primary border-border focus:ring-0 cursor-pointer shrink-0"
                          />

                          {/* Food Thumbnail */}
                          <div className="w-10 h-10 rounded-[8px] bg-amber-600/90 overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{dish.name.slice(0, 1).toUpperCase()}</span>
                            )}
                          </div>

                          {/* Name + Base Price */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-text truncate max-w-[170px] text-xs">
                                {dish.name}
                              </span>
                              {/* Veg green icon badge */}
                              <span
                                className="w-3.5 h-3.5 border border-emerald-600 rounded-[3px] flex items-center justify-center shrink-0"
                                title="Vegetarian"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              </span>
                            </div>
                            <span className="text-[11px] text-muted">
                              Base {formatPrice(dish.basePrice, brandCurrency)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY Column */}
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-text font-medium">
                          {dish.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* BRANCH Columns */}
                      {displayedBranches.map((b: any) => {
                        const bp = branchProductsMap.get(b.id);
                        const isAvailable = bp ? bp.isAvailable : true;
                        const hasOverride =
                          bp?.priceOverride !== null && bp?.priceOverride !== undefined;
                        const effectivePrice = hasOverride ? bp.priceOverride : dish.basePrice;

                        const isEditingThisCell =
                          editingCell?.branchId === b.id && editingCell?.productId === dish.id;

                        return (
                          <td
                            key={b.id}
                            className="py-2.5 px-4 border-l border-border align-middle"
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Green / Gray Switch matching sample image */}
                              <button
                                type="button"
                                onClick={() => canToggleStock && toggleAvailability({ branchId: b.id, productId: dish.id })}
                                disabled={!canToggleStock}
                                className={cn(
                                  'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                                  canToggleStock ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                                  isAvailable ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700',
                                )}
                                title={!canToggleStock ? 'Permission denied to toggle stock' : isAvailable ? 'Mark Sold Out' : 'Mark In Stock'}
                              >
                                <span
                                  className={cn(
                                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                                    isAvailable ? 'translate-x-4' : 'translate-x-0',
                                  )}
                                />
                              </button>

                              {/* Price or Out of Stock label */}
                              {isAvailable ? (
                                isEditingThisCell && canEditPrice ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      autoFocus
                                      value={tempPrice}
                                      onChange={(e) => setTempPrice(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSavePrice(b.id, dish.id);
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                      className="w-16 px-1.5 py-0.5 text-xs bg-surface border border-primary rounded font-bold"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSavePrice(b.id, dish.id)}
                                      className="p-0.5 text-emerald-600"
                                    >
                                      <Check size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCell(null)}
                                      className="p-0.5 text-muted"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : canEditPrice ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCell({ branchId: b.id, productId: dish.id });
                                      setTempPrice(hasOverride ? String(bp.priceOverride) : '');
                                    }}
                                    className="cursor-pointer group/price flex items-center gap-1"
                                    title="Click to override price"
                                  >
                                    {hasOverride ? (
                                      <span className="px-2 py-0.5 rounded-[5px] bg-primary-soft text-primary-soft-text font-bold text-xs border border-primary/20">
                                        {formatPrice(effectivePrice, b.currency || brandCurrency)}
                                      </span>
                                    ) : (
                                      <span className="font-bold text-xs text-text">
                                        {formatPrice(effectivePrice, b.currency || brandCurrency)}
                                      </span>
                                    )}
                                    <Edit2
                                      size={11}
                                      className="text-muted/0 group-hover/price:text-muted transition-opacity"
                                    />
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1 select-none">
                                    {hasOverride ? (
                                      <span className="px-2 py-0.5 rounded-[5px] bg-primary-soft text-primary-soft-text font-bold text-xs border border-primary/20">
                                        {formatPrice(effectivePrice, b.currency || brandCurrency)}
                                      </span>
                                    ) : (
                                      <span className="font-bold text-xs text-text">
                                        {formatPrice(effectivePrice, b.currency || brandCurrency)}
                                      </span>
                                    )}
                                  </div>
                                )
                              ) : (
                                <span className="text-xs text-muted/70 italic font-medium">
                                  Out of stock
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom helper note from Sample Image 2 */}
      <p className="text-[11px] text-muted">
        {products.length} dishes across {branches.length} branches. Switch = available at that
        branch. An orange price means the branch overrides the base price.
      </p>

      {/* Bulk Price Override Modal */}
      {bulkPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-backdrop backdrop-blur-xs"
            onClick={() => setBulkPriceModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-surface rounded-[14px] border border-border shadow-2xl p-5 space-y-4 z-10 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-text">
              Set Price Override for {selectedDishIds.length} Dishes
            </h3>
            <p className="text-xs text-muted">
              Enter the override price for these dishes across the selected branch(es). Leave blank
              to reset to Base Price.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text">Price ({brandCurrency})</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 180"
                value={bulkPriceValue}
                onChange={(e) => setBulkPriceValue(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-2 border border-border rounded-[8px] focus:outline-none focus:border-primary font-bold text-text"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBulkPriceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isBulkActing}
                onClick={handleBulkSetPrice}
              >
                Apply Override
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
