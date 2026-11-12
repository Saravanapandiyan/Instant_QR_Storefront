import React, { useState } from 'react';
import {
  Store,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Search,
  DollarSign,
  AlertCircle,
  RefreshCw,
  UtensilsCrossed,
} from 'lucide-react';
import { useBranchMenu } from '../../branches/hooks/useBranchMenu';
import { useCurrencyStore } from '../../../store/useCurrencyStore';
import { getMediaUrl } from '../../../lib/utils';
import { Button } from '../../../components/ui';
import type { Branch } from '@instant-qr/shared-types';

interface BranchStockManagerProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onAddBranchClick: () => void;
}

export const BranchStockManager: React.FC<BranchStockManagerProps> = ({
  branches,
  selectedBranchId,
  onSelectBranch,
  onAddBranchClick,
}) => {
  const { formatPrice, currentCurrency } = useCurrencyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null);
  const [tempPriceOverride, setTempPriceOverride] = useState<string>('');

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const effectiveBranchId = activeBranch?.id;

  const {
    branchMenu,
    isLoading,
    isError,
    error,
    refetch,
    toggleAvailability,
    updateOverride,
  } = useBranchMenu(effectiveBranchId);

  if (branches.length === 0) {
    return (
      <div className="p-12 text-center bg-surface border border-dashed border-border rounded-[12px] space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary-soft text-primary-soft-text flex items-center justify-center">
          <Store size={22} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text">No Branches Created Yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1">
            Create physical branches first so you can configure their live in-stock availability and
            enable/disable dishes per location.
          </p>
        </div>
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAddBranchClick}>
            + Create Branch Location
          </Button>
        </div>
      </div>
    );
  }

  // Extract dishes from backend items array or fallback to nested categories
  const allDishes =
    branchMenu?.items && branchMenu.items.length > 0
      ? branchMenu.items
      : (branchMenu?.categories || []).flatMap((cat) =>
          (cat.products || []).map((p) => ({
            ...p,
            categoryName: cat.name,
            categoryId: cat.id,
          })),
        );

  const branchCurrency = branchMenu?.branch?.currency || activeBranch?.currency || 'INR';
  const brandCurrency =
    branchMenu?.restaurant?.defaultCurrency ||
    activeBranch?.restaurant?.defaultCurrency ||
    'INR';
  const isCrossCurrency =
    branchMenu?.isCrossCurrency !== undefined
      ? branchMenu.isCrossCurrency
      : branchCurrency !== brandCurrency;

  const filteredDishes = allDishes.filter((dish) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return dish.name.toLowerCase().includes(q) || dish.categoryName.toLowerCase().includes(q);
  });

  const handleSavePriceOverride = async (productId: string) => {
    const num = tempPriceOverride.trim() ? Number(tempPriceOverride) : null;
    await updateOverride({
      productId,
      data: { priceOverride: num },
    });
    setEditingPriceProductId(null);
  };

  return (
    <div className="space-y-5">
      {/* Branch Selector Bar */}
      <div className="p-4 rounded-[12px] bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Select Branch Location:
            </span>
            {activeBranch && (
              <span className="px-2 py-0.5 rounded-[4px] bg-primary-soft text-primary-soft-text text-[11px] font-semibold">
                Brand: {activeBranch.restaurant?.name || 'Assigned Concept'}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-[4px] bg-surface-2 text-text text-[11px] font-mono border border-border">
              Currency: <strong>{branchCurrency}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {branches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBranch(b.id)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  b.id === effectiveBranchId
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-2 text-muted hover:text-text hover:bg-surface-2/80 border border-border'
                }`}
              >
                <Store size={14} />
                <span>{b.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({b.currency || 'INR'})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search branch dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-2 border border-border rounded-[8px] text-text placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Cross-Currency Warning Banner */}
      {isCrossCurrency && (
        <div className="p-3.5 rounded-[10px] bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-base">⚡</span>
            <div>
              <p className="font-semibold">
                Multi-Country Branch: Operating in {branchCurrency}
              </p>
              <p className="text-[11px] opacity-90">
                Master Brand catalog prices are in {brandCurrency}. Dishes require an explicit local price in {branchCurrency} before they can appear on this storefront.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-[4px] bg-amber-500/20 text-[10px] font-bold uppercase tracking-wider shrink-0">
            Cross-Currency
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-2">
          <RefreshCw size={22} className="animate-spin text-primary" />
          <p className="text-xs">Loading branch dish availability...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-4 rounded-[10px] bg-danger/10 border border-danger/25 text-danger flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{(error as any)?.message || 'Failed to load branch menu availability.'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Dishes Availability List */}
      {!isLoading && !isError && filteredDishes.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-dashed border-border rounded-[12px] space-y-2">
          <UtensilsCrossed size={22} className="mx-auto text-muted" />
          <p className="text-xs text-muted">
            {searchQuery
              ? `No dishes match "${searchQuery}".`
              : 'No dishes found in the master catalog for this brand yet. Switch to "Master Brand Catalog" tab above to add dishes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDishes.map((dish) => {
              const imageSrc = getMediaUrl(dish.imageUrl);
              const isEditingPrice = editingPriceProductId === dish.id;
              const hasPriceOverride = dish.priceOverride !== undefined && dish.priceOverride !== null;
              const requiresLocalPrice = isCrossCurrency && !hasPriceOverride;
              const effectivePrice = hasPriceOverride
                ? dish.priceOverride!
                : isCrossCurrency
                  ? null
                  : dish.basePrice;

              return (
                <div
                  key={dish.id}
                  className={`bg-surface border rounded-[12px] overflow-hidden flex flex-col justify-between transition-all ${
                    dish.isEnabled === false
                      ? 'border-border opacity-60 bg-surface-2/30'
                      : requiresLocalPrice
                        ? 'border-amber-500/40 bg-amber-500/5 shadow-xs'
                        : 'border-border hover:border-primary/40 shadow-xs'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-text truncate">
                            {dish.name}
                          </h3>
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-surface-2 text-[10px] text-muted border border-border">
                            {dish.categoryName}
                          </span>
                        </div>

                        {/* Price Tag with Currency Awareness */}
                        {requiresLocalPrice ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 pt-0.5">
                            <span>⚠️ Price Required ({branchCurrency})</span>
                            <span className="text-[10px] font-normal text-muted">
                              Base: {formatPrice(dish.basePrice, brandCurrency)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-bold text-text pt-0.5">
                            <span>{formatPrice(effectivePrice, branchCurrency)}</span>
                            {hasPriceOverride && (
                              <span className="text-[10px] font-normal text-muted line-through">
                                Base: {formatPrice(dish.basePrice, brandCurrency)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Image Thumbnail */}
                      <div className="w-14 h-14 rounded-[8px] bg-surface-2 border border-border overflow-hidden shrink-0 flex items-center justify-center text-muted">
                        {imageSrc ? (
                          <img src={imageSrc} alt={dish.name} className="w-full h-full object-cover" />
                        ) : (
                          <UtensilsCrossed size={18} className="text-muted/40" />
                        )}
                      </div>
                    </div>

                    {/* Quick Controls Section */}
                    <div className="pt-2 border-t border-border/80 flex items-center justify-between gap-2">
                      {/* Control 1: One-Click Toggle In Stock / Sold Out */}
                      <button
                        type="button"
                        onClick={() => toggleAvailability(dish.id)}
                        disabled={dish.isEnabled === false || requiresLocalPrice}
                        title={
                          requiresLocalPrice
                            ? `Set local price in ${branchCurrency} first`
                            : dish.isEnabled === false
                              ? 'Enable item first'
                              : 'Toggle In Stock / Sold Out'
                        }
                        className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          dish.isAvailable && !requiresLocalPrice
                            ? 'bg-success/15 text-success border border-success/30 hover:bg-success/25'
                            : 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25'
                        } ${(dish.isEnabled === false || requiresLocalPrice) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {dish.isAvailable && !requiresLocalPrice ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>

                      {/* Control 2: Enable / Disable for this Branch */}
                      <button
                        type="button"
                        onClick={() =>
                          updateOverride({
                            productId: dish.id,
                            data: { isEnabled: dish.isEnabled === false ? true : false },
                          })
                        }
                        className={`p-1.5 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium ${
                          dish.isEnabled === false
                            ? 'bg-surface-2 text-muted hover:text-text'
                            : 'bg-primary-soft text-primary-soft-text hover:bg-primary-soft/80'
                        }`}
                        title={
                          dish.isEnabled === false
                            ? 'Click to enable dish for this branch'
                            : 'Click to disable and hide dish from this branch'
                        }
                      >
                        {dish.isEnabled === false ? (
                          <>
                            <EyeOff size={13} />
                            <span>Disabled</span>
                          </>
                        ) : (
                          <>
                            <Eye size={13} />
                            <span>Active</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Control 3: Branch Price Override */}
                    <div className="pt-1">
                      {isEditingPrice ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <input
                            type="number"
                            step="0.01"
                            value={tempPriceOverride}
                            onChange={(e) => setTempPriceOverride(e.target.value)}
                            placeholder={`Local price in ${branchCurrency}`}
                            className="w-full px-2 py-1 rounded-[6px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePriceOverride(dish.id)}
                            className="px-2 py-1 rounded-[6px] bg-primary text-on-primary text-xs font-semibold cursor-pointer shrink-0"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceProductId(null)}
                            className="p-1 rounded text-muted hover:text-text cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : requiresLocalPrice ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceProductId(dish.id);
                            setTempPriceOverride('');
                          }}
                          className="px-2.5 py-1.5 rounded-[6px] bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors w-full justify-center border border-amber-500/30"
                        >
                          <DollarSign size={13} />
                          <span>Set Local Price in {branchCurrency}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceProductId(dish.id);
                            setTempPriceOverride(
                              hasPriceOverride ? String(dish.priceOverride) : '',
                            );
                          }}
                          className="text-[11px] text-muted hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <DollarSign size={11} />
                          <span>
                            {hasPriceOverride
                              ? `Edit Price Override (${formatPrice(dish.priceOverride, branchCurrency)})`
                              : '+ Set Branch Price Override'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
