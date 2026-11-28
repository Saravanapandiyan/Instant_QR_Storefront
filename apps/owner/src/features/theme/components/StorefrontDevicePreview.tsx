import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, Sun, Moon } from 'lucide-react';
import type { StorefrontThemePalette } from '@instant-qr/shared-types';
import { PreviewMenuContent } from './PreviewMenuContent';
import { cn } from '../../../lib/utils';

interface StorefrontDevicePreviewProps {
  restaurantName: string;
  palette: StorefrontThemePalette;
  activeMode: 'light' | 'dark';
  onToggleMode: (mode: 'light' | 'dark') => void;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const StorefrontDevicePreview: React.FC<StorefrontDevicePreviewProps> = ({
  restaurantName,
  palette,
  activeMode,
  onToggleMode,
}) => {
  const [device, setDevice] = useState<DeviceType>('mobile');

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Device & Mode Switchers Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Device Switcher Pills (hidden on mobile < md) */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-surface-2 border border-border shadow-2xs overflow-x-auto scrollbar-none max-w-full">
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={cn(
              'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0',
              device === 'mobile'
                ? 'bg-surface text-text shadow-xs border border-border font-bold'
                : 'text-muted hover:text-text',
            )}
            title="Mobile View (375px)"
          >
            <Smartphone size={14} className="shrink-0" />
            <span>Mobile</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={cn(
              'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0',
              device === 'tablet'
                ? 'bg-surface text-text shadow-xs border border-border font-bold'
                : 'text-muted hover:text-text',
            )}
            title="Tablet View (768px)"
          >
            <Tablet size={14} className="shrink-0" />
            <span>Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={cn(
              'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0',
              device === 'desktop'
                ? 'bg-surface text-text shadow-xs border border-border font-bold'
                : 'text-muted hover:text-text',
            )}
            title="Desktop / Web View"
          >
            <Monitor size={14} className="shrink-0" />
            <span className="sm:hidden">Desktop</span>
            <span className="hidden sm:inline">Web / Desktop</span>
          </button>
        </div>

        {/* Light / Dark Mode Toggle Button for Preview */}
        <div className="flex items-center p-1 rounded-xl bg-surface-2 border border-border shadow-2xs">
          <button
            type="button"
            onClick={() => onToggleMode('light')}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all',
              activeMode === 'light'
                ? 'bg-surface text-text shadow-xs border border-border font-bold'
                : 'text-muted hover:text-text',
            )}
          >
            <Sun size={13} className={activeMode === 'light' ? 'text-amber-500' : ''} />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleMode('dark')}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all',
              activeMode === 'dark'
                ? 'bg-surface text-text shadow-xs border border-border font-bold'
                : 'text-muted hover:text-text',
            )}
          >
            <Moon size={13} className={activeMode === 'dark' ? 'text-indigo-400' : ''} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* Device Frame Display Area */}
      <div className="flex-1 min-h-[520px] sm:min-h-[550px] p-2 sm:p-6 rounded-2xl bg-surface-2/40 border border-border flex items-center justify-center overflow-auto">
        {/* 1. MOBILE FRAME (always shown on < md, or when device === 'mobile' on md+) */}
        <div
          className={cn(
            'w-full max-w-[330px] h-[540px] sm:h-[580px] rounded-[32px] sm:rounded-[38px] p-2 sm:p-3 shadow-2xl border-4 border-zinc-800 dark:border-zinc-700 bg-zinc-950 flex-col shrink-0 animate-in fade-in zoom-in-95 duration-200',
            device === 'mobile' ? 'flex' : 'flex md:hidden',
          )}
        >
          {/* Camera Notch */}
          <div className="w-24 h-4 bg-zinc-800 rounded-full mx-auto mb-2 shrink-0 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-zinc-950 inline-block mr-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 inline-block" />
          </div>

          {/* Screen */}
          <div className="flex-1 rounded-[26px] overflow-hidden flex flex-col">
            <PreviewMenuContent
              restaurantName={restaurantName}
              palette={palette}
              device="mobile"
            />
          </div>
        </div>

        {/* 2. TABLET FRAME (md+ only) */}
        {device === 'tablet' && (
          <div className="hidden md:flex w-full max-w-[560px] h-[600px] rounded-[32px] p-3 shadow-2xl border-4 border-zinc-800 dark:border-zinc-700 bg-zinc-950 flex-col shrink-0 animate-in fade-in zoom-in-95 duration-200">
            {/* Tablet Camera Dot */}
            <div className="w-2 h-2 rounded-full bg-zinc-800 mx-auto mb-2 shrink-0" />

            {/* Screen */}
            <div className="flex-1 rounded-[22px] overflow-hidden flex flex-col">
              <PreviewMenuContent
                restaurantName={restaurantName}
                palette={palette}
                device="tablet"
              />
            </div>
          </div>
        )}

        {/* 3. DESKTOP / WEB FRAME (md+ only) */}
        {device === 'desktop' && (
          <div className="hidden md:flex w-full h-[600px] rounded-2xl shadow-2xl border border-border bg-surface flex-col overflow-hidden shrink-0 animate-in fade-in zoom-in-95 duration-200">
            {/* Browser Window Header Chrome */}
            <div className="h-9 px-4 bg-surface-2 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              {/* Mock Address Bar */}
              <div className="px-3 py-0.5 rounded-md bg-surface border border-border text-[11px] font-mono text-muted flex items-center gap-2 max-w-xs w-full justify-center">
                <span>🔒 instadine.app/r/downtown-branch</span>
              </div>

              <div className="w-10" />
            </div>

            {/* Browser Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <PreviewMenuContent
                restaurantName={restaurantName}
                palette={palette}
                device="desktop"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

