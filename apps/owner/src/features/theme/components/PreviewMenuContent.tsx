import React from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import type { StorefrontThemePalette } from '@instant-qr/shared-types';

interface PreviewMenuContentProps {
  restaurantName: string;
  palette: StorefrontThemePalette;
  device: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Calculates high-contrast text color (#ffffff or #09090b)
 * based on the relative luminance of the background hex.
 */
export const getContrastColor = (hexColor: string): string => {
  if (!hexColor) return '#ffffff';
  const hex = hexColor.replace('#', '');
  if (hex.length < 6) return '#ffffff';

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff';

  // YIQ luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? '#09090b' : '#ffffff';
};

export const PreviewMenuContent: React.FC<PreviewMenuContentProps> = ({
  restaurantName,
  palette,
  device,
}) => {
  const isMobile = device === 'mobile';
  const isTablet = device === 'tablet';
  const isDesktop = device === 'desktop';

  // Dynamic high-contrast text colors
  const onPrimaryColor = getContrastColor(palette.primary);
  const onSurfaceColor = palette.text || '#18181b';
  const mutedTextColor = palette.textMuted || '#71717a';

  return (
    <div
      className="w-full h-full flex flex-col overflow-y-auto select-none transition-colors duration-200"
      style={{
        backgroundColor: palette.background,
        color: onSurfaceColor,
      }}
    >
      {/* 1. Header Bar */}
      <header
        className="px-4 py-3 border-b shrink-0 transition-colors"
        style={{
          backgroundColor: palette.surface,
          borderColor: `${onSurfaceColor}18`,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs transition-colors"
              style={{
                backgroundColor: palette.primary,
                color: onPrimaryColor,
              }}
            >
              {restaurantName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div
                className="text-xs sm:text-sm font-bold truncate leading-tight transition-colors"
                style={{ color: onSurfaceColor }}
              >
                {restaurantName}
              </div>
              <p
                className="text-[10px] sm:text-xs truncate transition-colors"
                style={{ color: mutedTextColor }}
              >
                Downtown Branch · Open Now
              </p>
            </div>
          </div>

          {/* Desktop / Tablet Search & Cart */}
          {!isMobile && (
            <div className="flex items-center gap-3">
              <div
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-colors"
                style={{
                  backgroundColor: palette.background,
                  borderColor: `${onSurfaceColor}20`,
                  color: mutedTextColor,
                }}
              >
                <Search size={13} style={{ color: mutedTextColor }} />
                <span className="text-[11px]" style={{ color: mutedTextColor }}>
                  Search dishes...
                </span>
              </div>

              <div
                className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                style={{
                  backgroundColor: palette.primary,
                  color: onPrimaryColor,
                }}
              >
                <ShoppingBag size={13} style={{ color: onPrimaryColor }} />
                <span style={{ color: onPrimaryColor }}>Cart (2)</span>
              </div>
            </div>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-hidden text-[11px]">
          <span
            className="px-2.5 py-0.5 rounded-full font-bold shrink-0 shadow-2xs transition-colors"
            style={{
              backgroundColor: palette.primary,
              color: onPrimaryColor,
            }}
          >
            All Dishes
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full shrink-0 font-medium border transition-colors"
            style={{
              backgroundColor: palette.surface,
              borderColor: `${onSurfaceColor}20`,
              color: mutedTextColor,
            }}
          >
            Starters
          </span>
          <span
            className="px-2.5 py-0.5 rounded-full shrink-0 font-medium border transition-colors"
            style={{
              backgroundColor: palette.surface,
              borderColor: `${onSurfaceColor}20`,
              color: mutedTextColor,
            }}
          >
            Main Course
          </span>
          {!isMobile && (
            <>
              <span
                className="px-2.5 py-0.5 rounded-full shrink-0 font-medium border transition-colors"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: `${onSurfaceColor}20`,
                  color: mutedTextColor,
                }}
              >
                Desserts
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full shrink-0 font-medium border transition-colors"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: `${onSurfaceColor}20`,
                  color: mutedTextColor,
                }}
              >
                Beverages
              </span>
            </>
          )}
        </div>
      </header>

      {/* 2. Menu Items Grid */}
      <main className="p-3 sm:p-4 flex-1 overflow-y-auto">
        <div
          className={`grid gap-2.5 ${
            isDesktop ? 'grid-cols-3' : isTablet ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {/* Dish 1: Dragon chicken */}
          <div
            className="p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-2xs border transition-colors"
            style={{
              backgroundColor: palette.surface,
              borderColor: `${onSurfaceColor}15`,
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-red-500 rounded-xs flex items-center justify-center shrink-0">
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                </span>
                <span className="text-xs font-bold truncate" style={{ color: onSurfaceColor }}>
                  Dragon chicken
                </span>
              </div>
              <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: mutedTextColor }}>
                Crispy tossed in spicy tangy chili sauce
              </p>
              <div className="text-xs font-bold font-mono mt-1.5" style={{ color: onSurfaceColor }}>
                ₹200
              </div>
            </div>

            <button
              type="button"
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs shrink-0 cursor-default transition-colors"
              style={{
                backgroundColor: palette.primary,
                color: onPrimaryColor,
              }}
            >
              + ADD
            </button>
          </div>

          {/* Dish 2: Masala Dosa */}
          <div
            className="p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-2xs border transition-colors"
            style={{
              backgroundColor: palette.surface,
              borderColor: `${onSurfaceColor}15`,
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-emerald-500 rounded-xs flex items-center justify-center shrink-0">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold truncate" style={{ color: onSurfaceColor }}>
                  Masala Dosa
                </span>
              </div>
              <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: mutedTextColor }}>
                Crisp golden crepe filled with spiced potato
              </p>
              <div className="text-xs font-bold font-mono mt-1.5" style={{ color: onSurfaceColor }}>
                ₹90
              </div>
            </div>

            <button
              type="button"
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs shrink-0 cursor-default transition-colors"
              style={{
                backgroundColor: palette.primary,
                color: onPrimaryColor,
              }}
            >
              + ADD
            </button>
          </div>

          {/* Dish 3: Paneer Butter Masala */}
          {(!isMobile || isTablet || isDesktop) && (
            <div
              className="p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-2xs border transition-colors"
              style={{
                backgroundColor: palette.surface,
                borderColor: `${onSurfaceColor}15`,
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border border-emerald-500 rounded-xs flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold truncate" style={{ color: onSurfaceColor }}>
                    Paneer Butter Masala
                  </span>
                </div>
                <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: mutedTextColor }}>
                  Creamy rich tomato sauce with cottage cheese
                </p>
                <div className="text-xs font-bold font-mono mt-1.5" style={{ color: onSurfaceColor }}>
                  ₹220
                </div>
              </div>

              <button
                type="button"
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs shrink-0 cursor-default transition-colors"
                style={{
                  backgroundColor: palette.primary,
                  color: onPrimaryColor,
                }}
              >
                + ADD
              </button>
            </div>
          )}

          {/* Dish 4: Filter Coffee (Desktop only) */}
          {isDesktop && (
            <div
              className="p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-2xs border transition-colors"
              style={{
                backgroundColor: palette.surface,
                borderColor: `${onSurfaceColor}15`,
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 border border-emerald-500 rounded-xs flex items-center justify-center shrink-0">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold truncate" style={{ color: onSurfaceColor }}>
                    Filter Coffee
                  </span>
                </div>
                <p className="text-[10px] line-clamp-1 mt-0.5" style={{ color: mutedTextColor }}>
                  Freshly brewed authentic South Indian chicory blend
                </p>
                <div className="text-xs font-bold font-mono mt-1.5" style={{ color: onSurfaceColor }}>
                  ₹40
                </div>
              </div>

              <button
                type="button"
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-2xs shrink-0 cursor-default transition-colors"
                style={{
                  backgroundColor: palette.primary,
                  color: onPrimaryColor,
                }}
              >
                + ADD
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. Mobile Floating Bottom Cart Bar */}
      {isMobile && (
        <div className="p-2.5 shrink-0">
          <div
            className="p-2.5 rounded-xl shadow-lg flex items-center justify-between transition-colors"
            style={{
              backgroundColor: palette.primary,
              color: onPrimaryColor,
            }}
          >
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: onPrimaryColor }}>
              <ShoppingBag size={14} style={{ color: onPrimaryColor }} />
              <span style={{ color: onPrimaryColor }}>2 items · ₹290</span>
            </div>
            <span
              className="text-xs font-bold underline cursor-pointer"
              style={{ color: onPrimaryColor }}
            >
              View Cart
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
