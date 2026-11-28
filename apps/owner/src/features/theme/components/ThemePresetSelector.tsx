import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { STOREFRONT_THEME_PRESETS } from '../../../config/theme-presets.config';
import { cn } from '../../../lib/utils';
import type { StorefrontThemeConfig } from '@instant-qr/shared-types';

interface ThemePresetSelectorProps {
  currentPresetId?: string;
  onSelectPreset: (config: StorefrontThemeConfig) => void;
}

export const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({
  currentPresetId,
  onSelectPreset,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Curated Color Presets
        </label>
        <span className="text-[11px] text-muted flex items-center gap-1 font-medium whitespace-nowrap">
          <Sparkles size={12} className="text-primary shrink-0" /> Instant One-Click Styles
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
        {STOREFRONT_THEME_PRESETS.map((preset) => {
          const isSelected = currentPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset.config)}
              className={cn(
                'p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-2.5 group',
                isSelected
                  ? 'border-primary bg-primary-soft/30 shadow-xs ring-1 ring-primary'
                  : 'border-border bg-surface hover:bg-surface-2/60 hover:border-border/80',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-6 h-6 rounded-full border border-black/10 shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: preset.previewAccent }}
                />
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                    <Check size={12} />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full border border-border shrink-0" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-text truncate">
                  {preset.name}
                </div>
                <div className="text-[10px] text-muted line-clamp-1 mt-0.5 opacity-80">
                  {preset.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

