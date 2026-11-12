import { useEffect, useState } from 'react';
import type { StorefrontThemeConfig } from '@instant-qr/shared-types';

export function getContrastColor(hexColor: string): '#ffffff' | '#09090b' {
  if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
  let hex = hexColor.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? '#09090b' : '#ffffff';
}

export function useStorefrontTheme(themeConfig?: StorefrontThemeConfig | null) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sf_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('sf_dark_mode', String(next));
      return next;
    });
  };

  useEffect(() => {
    // 1. Fallback Warm Palette (matching Reference Image 2)
    const fallbackLight = {
      primary: '#c2410c', // Warm Terracotta
      background: '#fff9f5', // Warm Cream Page Background
      surface: '#ffffff', // Crisp White Card Surface
      bannerBg: '#fdeee3', // Soft Terracotta Cream Banner
      text: '#1c1917', // Rich Espresso Dark Text (never washed out)
      textMuted: '#78716c',
      border: '#f0e6de',
    };

    const fallbackDark = {
      primary: '#ea580c',
      background: '#0c0a09', // Dark Obsidian Background
      surface: '#171412', // Warm Dark Surface
      bannerBg: '#1c1410', // Dark Tinted Banner
      text: '#fafaf9', // Crisp White Text (100% visible)
      textMuted: '#a8a29e',
      border: '#292524',
    };

    const active = isDarkMode
      ? {
          primary: themeConfig?.dark?.primary || fallbackDark.primary,
          background: themeConfig?.dark?.background || fallbackDark.background,
          surface: themeConfig?.dark?.surface || fallbackDark.surface,
          bannerBg: fallbackDark.bannerBg,
          text: themeConfig?.dark?.text || fallbackDark.text,
          textMuted: themeConfig?.dark?.textMuted || fallbackDark.textMuted,
          border: fallbackDark.border,
        }
      : {
          primary: themeConfig?.light?.primary || fallbackLight.primary,
          background: fallbackLight.background,
          surface: fallbackLight.surface,
          bannerBg: fallbackLight.bannerBg,
          text: fallbackLight.text,
          textMuted: fallbackLight.textMuted,
          border: fallbackLight.border,
        };

    const root = document.documentElement;

    root.style.setProperty('--sf-primary', active.primary);
    root.style.setProperty('--sf-primary-contrast', getContrastColor(active.primary));
    root.style.setProperty('--sf-bg', active.background);
    root.style.setProperty('--sf-surface', active.surface);
    root.style.setProperty('--sf-banner-bg', active.bannerBg);
    root.style.setProperty('--sf-text', active.text);
    root.style.setProperty('--sf-muted', active.textMuted);
    root.style.setProperty('--sf-border', active.border);

    document.body.style.backgroundColor = active.background;
    document.body.style.color = active.text;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', active.primary);
    }
  }, [themeConfig, isDarkMode]);

  return { isDarkMode, toggleDarkMode };
}
