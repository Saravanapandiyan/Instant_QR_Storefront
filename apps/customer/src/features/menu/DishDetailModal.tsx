import { useState, useEffect } from 'react';
import { X, Plus, Minus, Utensils, Sparkles, AlertCircle } from 'lucide-react';
import type { StorefrontItem } from '../../types/storefront.ts';

interface DishDetailModalProps {
  item: StorefrontItem | null;
  currencySymbol: string;
  initialQuantity?: number;
  initialNotes?: string;
  onClose: () => void;
  onConfirm: (item: StorefrontItem, quantity: number, notes: string) => void;
}

const QUICK_TAGS = [
  'Less spicy',
  'Extra spicy',
  'No onion',
  'No garlic',
  'Crispy',
  'Less oil',
];

function getAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.replace(/^\/?(uploads\/)?/, '');
  return `/uploads/${clean}`;
}

export function DishDetailModal({
  item,
  currencySymbol,
  initialQuantity = 1,
  initialNotes = '',
  onClose,
  onConfirm,
}: DishDetailModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity > 0 ? initialQuantity : 1);
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (item) {
      setQuantity(initialQuantity > 0 ? initialQuantity : 1);
      setNotes(initialNotes || '');
    }
  }, [item, initialQuantity, initialNotes]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [item]);

  if (!item) return null;

  const price = Number(item.finalPrice || item.basePrice || 0);
  const totalPrice = (price * quantity).toFixed(2).replace(/\.00$/, '');
  const isSoldOut = !item.isAvailable;

  const handleTagClick = (tag: string) => {
    if (notes.includes(tag)) {
      // Remove tag
      const updated = notes
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t !== tag && t.length > 0)
        .join(', ');
      setNotes(updated);
    } else {
      // Append tag
      const clean = notes.trim();
      const updated = clean.length > 0 ? `${clean}, ${tag}` : tag;
      if (updated.length <= 150) {
        setNotes(updated);
      }
    }
  };

  const handleConfirm = () => {
    if (isSoldOut) return;
    onConfirm(item, quantity, notes.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md my-auto rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
        style={{
          backgroundColor: 'var(--sf-surface)',
          borderColor: 'var(--sf-border)',
          color: 'var(--sf-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-all cursor-pointer shadow-md border border-white/20"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Content (explicit rounded-t-2xl to prevent child image bleed) */}
        <div className="overflow-y-auto flex-1 overscroll-contain rounded-t-2xl">
          {/* Dish Image Banner: Flush with top rounded corners */}
          <div className="relative h-44 sm:h-52 w-full bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center overflow-hidden rounded-t-2xl shrink-0">
            {/* Fallback Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center">
                <Utensils className="w-8 h-8 text-white/70" />
              </div>
            </div>

            {item.imageUrl && (
              <img
                src={getAssetUrl(item.imageUrl)!}
                alt={item.name}
                className="relative z-10 w-full h-full object-cover rounded-t-2xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}

            {/* Veg / Non-Veg Indicator Badge */}
            <div className="absolute top-3 left-3 bg-white/95 rounded-xs p-1 shadow-md z-20">
              <div
                className={`w-3.5 h-3.5 border flex items-center justify-center ${
                  item.isVeg !== false ? 'border-emerald-600' : 'border-red-600'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg !== false ? 'bg-emerald-600' : 'bg-red-600'
                  }`}
                />
              </div>
            </div>

            {/* Bestseller Badge */}
            {item.isBestseller && (
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-zinc-950 shadow-md">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Bestseller</span>
              </div>
            )}

            {/* Sold Out Overlay */}
            {isSoldOut && (
              <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center backdrop-blur-xs">
                <div className="px-3 py-1 rounded-lg bg-zinc-900/90 text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Currently Sold Out</span>
                </div>
              </div>
            )}
          </div>

          {/* Details Body */}
          <div className="p-3.5 sm:p-5 space-y-3">
            {/* Title & Price Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border"
                  style={{
                    backgroundColor: 'var(--sf-bg)',
                    borderColor: 'var(--sf-border)',
                    color: 'var(--sf-muted)',
                  }}
                >
                  {item.categoryName || 'Menu Item'}
                </span>
                <span className="text-[11px] font-medium" style={{ color: item.isVeg !== false ? '#10b981' : '#ef4444' }}>
                  {item.isVeg !== false ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight" style={{ color: 'var(--sf-text)' }}>
                  {item.name}
                </h2>
                <div className="text-sm sm:text-base md:text-lg font-bold whitespace-nowrap" style={{ color: 'var(--sf-primary)' }}>
                  {currencySymbol}{price}
                </div>
              </div>

              {item.description ? (
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--sf-muted)' }}>
                  {item.description}
                </p>
              ) : (
                <p className="mt-1 text-xs italic" style={{ color: 'var(--sf-muted)' }}>
                  Freshly prepared at our branch kitchen.
                </p>
              )}
            </div>

            {/* Cooking Instructions / Preferences Section */}
            {!isSoldOut && (
              <div className="pt-2.5 border-t space-y-2" style={{ borderColor: 'var(--sf-border)' }}>
                <div className="flex items-center justify-between">
                  <label htmlFor="dish-notes" className="text-xs font-bold" style={{ color: 'var(--sf-text)' }}>
                    Special cooking instructions
                  </label>
                  <span className="text-[10px]" style={{ color: 'var(--sf-muted)' }}>
                    {notes.length}/150
                  </span>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = notes.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagClick(tag)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border cursor-pointer active:scale-95"
                        style={
                          isSelected
                            ? {
                                backgroundColor: 'var(--sf-primary)',
                                color: 'var(--sf-primary-contrast)',
                                borderColor: 'transparent',
                              }
                            : {
                                backgroundColor: 'var(--sf-bg)',
                                color: 'var(--sf-text)',
                                borderColor: 'var(--sf-border)',
                              }
                        }
                      >
                        {tag} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>

                {/* Notes Input Area */}
                <textarea
                  id="dish-notes"
                  rows={2}
                  maxLength={150}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Less spicy, no onion, extra lemon on the side..."
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 transition-all resize-none"
                  style={{
                    backgroundColor: 'var(--sf-bg)',
                    borderColor: 'var(--sf-border)',
                    color: 'var(--sf-text)',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="p-3 sm:p-4 border-t flex items-center justify-between gap-3 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          style={{
            backgroundColor: 'var(--sf-surface)',
            borderColor: 'var(--sf-border)',
          }}
        >
          {isSoldOut ? (
            <div
              className="w-full py-2.5 rounded-xl font-bold text-xs text-center border"
              style={{
                backgroundColor: 'var(--sf-bg)',
                borderColor: 'var(--sf-border)',
                color: 'var(--sf-muted)',
              }}
            >
              Item unavailable to order
            </div>
          ) : (
            <>
              {/* Stepper */}
              <div
                className="flex items-center rounded-xl border p-0.5"
                style={{
                  backgroundColor: 'var(--sf-bg)',
                  borderColor: 'var(--sf-border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1.5 rounded-lg hover:bg-black/10 active:scale-90 transition-all cursor-pointer"
                  disabled={quantity <= 1}
                  style={{ color: quantity <= 1 ? 'var(--sf-muted)' : 'var(--sf-text)' }}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-xs" style={{ color: 'var(--sf-text)' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-1.5 rounded-lg hover:bg-black/10 active:scale-90 transition-all cursor-pointer"
                  style={{ color: 'var(--sf-text)' }}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add / Update Button */}
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs shadow-md active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer"
                style={{
                  backgroundColor: 'var(--sf-primary)',
                  color: 'var(--sf-primary-contrast)',
                }}
              >
                <span>{initialQuantity > 0 ? 'Update Item' : 'Add to Order'}</span>
                <span>{currencySymbol}{totalPrice}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

