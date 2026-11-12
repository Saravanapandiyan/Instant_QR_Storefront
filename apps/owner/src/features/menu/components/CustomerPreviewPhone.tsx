import React, { useState } from 'react';
import { ExternalLink, UtensilsCrossed, Plus } from 'lucide-react';
import { getMediaUrl, cn } from '../../../lib/utils';
import { getCustomerStorefrontUrl } from '../../../lib/urls';
import type { Product, Category } from '../api/menu-api';

interface CustomerPreviewPhoneProps {
  restaurantName: string;
  currencySymbol?: string;
  categories: Category[];
  products: Product[];
  selectedDishId?: string | null;
  onSelectDish?: (dishId: string) => void;
  branchSlug?: string;
}

export const CustomerPreviewPhone: React.FC<CustomerPreviewPhoneProps> = ({
  restaurantName,
  currencySymbol = '₹',
  categories,
  products,
  selectedDishId,
  onSelectDish,
  branchSlug,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  const fullUrl = branchSlug ? getCustomerStorefrontUrl(branchSlug) : '#';

  const displayedDishes =
    activeCategoryTab === 'all'
      ? products
      : products.filter((p) => p.categoryId === activeCategoryTab);

  return (
    <div className="w-full space-y-2">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-text">Customer preview</h3>
        {branchSlug && (
          <a
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#c2410c] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open storefront</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Realistic Mobile Device Frame */}
      <div className="w-full max-w-[310px] mx-auto bg-neutral-900 rounded-[38px] p-2.5 shadow-2xl border-4 border-neutral-800">
        <div className="bg-[#fcfbf9] text-neutral-900 rounded-[28px] overflow-hidden flex flex-col h-[520px] relative select-none">
          {/* Top Speaker / Dynamic Island */}
          <div className="w-20 h-3.5 bg-neutral-900 rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
          </div>

          {/* In-App Header */}
          <div className="pt-6 pb-2.5 px-4 bg-white border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                {restaurantName || 'Restaurant Menu'}
              </h4>
              <p className="text-[9px] text-neutral-400">Digital QR Storefront</p>
            </div>
            <span className="px-1.5 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-700 text-[9px] font-bold tracking-wider">
              TABLE 4
            </span>
          </div>

          {/* Category Pills Bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-neutral-100 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveCategoryTab('all')}
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer',
                activeCategoryTab === 'all'
                  ? 'bg-[#c2410c] text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              )}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryTab(cat.id)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer',
                  activeCategoryTab === cat.id
                    ? 'bg-[#c2410c] text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Scrollable Dish Items inside Phone */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 pb-14">
            {displayedDishes.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs">
                <UtensilsCrossed size={18} className="mx-auto mb-1 opacity-40" />
                No dishes in this category
              </div>
            ) : (
              displayedDishes.map((dish) => {
                const imageSrc = getMediaUrl(dish.imageUrl);
                const isSelected = selectedDishId === dish.id;

                return (
                  <div
                    key={dish.id}
                    onClick={() => onSelectDish?.(dish.id)}
                    className={cn(
                      'p-2 rounded-[10px] bg-white border transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs',
                      isSelected
                        ? 'border-[#c2410c] ring-1.5 ring-[#c2410c] bg-orange-50/30'
                        : 'border-neutral-200/70 hover:border-neutral-300',
                    )}
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-[8px] bg-amber-600 overflow-hidden shrink-0 flex items-center justify-center text-white font-bold text-xs">
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
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 truncate">
                          {dish.name}
                        </p>
                        <p className="text-[11px] font-bold text-neutral-700">
                          {currencySymbol}
                          {Number(dish.basePrice ?? dish.price ?? 0).toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* Right: ADD button */}
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-[5px] border border-[#c2410c] text-[#c2410c] text-[10px] font-bold hover:bg-[#c2410c] hover:text-white transition-colors shrink-0"
                    >
                      ADD
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Bottom View Cart Bar */}
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <div className="px-3 py-2 rounded-[10px] bg-[#c2410c] text-white flex items-center justify-between text-xs font-bold shadow-md">
              <span className="text-[11px]">View cart · 2 items</span>
              <span className="text-[11px]">{currencySymbol}310</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle helper */}
      <p className="text-[11px] text-muted text-center">
        Select a dish to see it here. Edits show up instantly.
      </p>
    </div>
  );
};
