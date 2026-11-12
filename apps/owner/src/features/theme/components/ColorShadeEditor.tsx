import React from 'react';
import type { StorefrontThemePalette } from '@instant-qr/shared-types';

interface ColorShadeEditorProps {
  mode: 'light' | 'dark';
  palette: StorefrontThemePalette;
  onChangeColor: (field: keyof StorefrontThemePalette, value: string) => void;
}

interface ColorFieldConfig {
  key: keyof StorefrontThemePalette;
  label: string;
  description: string;
}

const COLOR_FIELDS: ColorFieldConfig[] = [
  {
    key: 'primary',
    label: 'Primary Accent Color',
    description: 'Buttons, active category pills, badges, floating cart bar',
  },
  {
    key: 'background',
    label: 'Canvas Background',
    description: 'Main page backdrop color behind the digital storefront',
  },
  {
    key: 'surface',
    label: 'Card / Surface Color',
    description: 'Dish cards, top header panel, and bottom checkout sheets',
  },
  {
    key: 'text',
    label: 'Primary Text Color',
    description: 'Headings, dish names, and item prices',
  },
  {
    key: 'textMuted',
    label: 'Muted Text Color',
    description: 'Descriptions, dish dietary notes, and subtitles',
  },
];

export const ColorShadeEditor: React.FC<ColorShadeEditorProps> = ({
  mode,
  palette,
  onChangeColor,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          {mode === 'light' ? 'Light' : 'Dark'} Mode Color Shades
        </label>
        <span className="text-[11px] text-muted">Fine-tune individual hex values</span>
      </div>

      <div className="space-y-2.5">
        {COLOR_FIELDS.map((field) => {
          const val = palette[field.key] || '#000000';

          return (
            <div
              key={field.key}
              className="p-3.5 rounded-xl bg-surface-2/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border/80 transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-text">{field.label}</div>
                <div className="text-[11px] text-muted truncate mt-0.5 opacity-80">
                  {field.description}
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <div className="relative flex items-center">
                  <input
                    type="color"
                    id={`color-picker-${field.key}`}
                    value={val}
                    onChange={(e) => onChangeColor(field.key, e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-border p-0.5 bg-surface shadow-2xs"
                  />
                </div>
                <input
                  type="text"
                  value={val}
                  maxLength={9}
                  onChange={(e) => onChangeColor(field.key, e.target.value)}
                  className="w-24 px-2.5 py-1.5 text-xs font-mono font-bold bg-surface border border-border rounded-lg text-text uppercase focus:outline-none focus:border-primary shadow-2xs"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

