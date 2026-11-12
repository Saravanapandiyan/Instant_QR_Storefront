import type { StorefrontThemeConfig } from '@instant-qr/shared-types';

export interface ThemePresetOption {
  id: string;
  name: string;
  description: string;
  previewAccent: string;
  config: StorefrontThemeConfig;
}

export const STOREFRONT_THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'terracotta',
    name: 'Warm Terracotta',
    description: 'Inviting, energetic warm tone suited for casual dining, fast casual, and family restaurants.',
    previewAccent: '#c2410c',
    config: {
      presetId: 'terracotta',
      light: {
        primary: '#c2410c',
        background: '#fafafa',
        surface: '#ffffff',
        text: '#18181b',
        textMuted: '#71717a',
      },
      dark: {
        primary: '#ea580c',
        background: '#09090b',
        surface: '#18181b',
        text: '#f4f4f5',
        textMuted: '#a1a1aa',
      },
    },
  },
  {
    id: 'emerald',
    name: 'Fresh Emerald',
    description: 'Clean, botanical green ideal for salads, vegan menus, organic cafes, and juice bars.',
    previewAccent: '#059669',
    config: {
      presetId: 'emerald',
      light: {
        primary: '#059669',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#0f172a',
        textMuted: '#64748b',
      },
      dark: {
        primary: '#10b981',
        background: '#09090b',
        surface: '#0f1712',
        text: '#f8fafc',
        textMuted: '#94a3b8',
      },
    },
  },
  {
    id: 'crimson',
    name: 'Royal Crimson',
    description: 'Bold, rich red tone perfect for steakhouses, barbecue joints, bars, and fine dining.',
    previewAccent: '#be123c',
    config: {
      presetId: 'crimson',
      light: {
        primary: '#be123c',
        background: '#fff1f2',
        surface: '#ffffff',
        text: '#1c1917',
        textMuted: '#78716c',
      },
      dark: {
        primary: '#f43f5e',
        background: '#09090b',
        surface: '#1c1014',
        text: '#fafaf9',
        textMuted: '#a8a29e',
      },
    },
  },
  {
    id: 'amber',
    name: 'Golden Saffron',
    description: 'Warm, aromatic golden yellow celebrating rich spices, biryani, curries, and Indian cuisine.',
    previewAccent: '#d97706',
    config: {
      presetId: 'amber',
      light: {
        primary: '#d97706',
        background: '#fffbeb',
        surface: '#ffffff',
        text: '#1c1917',
        textMuted: '#78716c',
      },
      dark: {
        primary: '#f59e0b',
        background: '#09090b',
        surface: '#1c1708',
        text: '#fef3c7',
        textMuted: '#a8a29e',
      },
    },
  },
  {
    id: 'espresso',
    name: 'Cafe Espresso',
    description: 'Earthy artisan brown tones tailored for coffee roasters, bakeries, and dessert parlors.',
    previewAccent: '#78350f',
    config: {
      presetId: 'espresso',
      light: {
        primary: '#78350f',
        background: '#fdf8f6',
        surface: '#ffffff',
        text: '#1c1917',
        textMuted: '#78716c',
      },
      dark: {
        primary: '#d97706',
        background: '#0c0a09',
        surface: '#1c1917',
        text: '#fafaf9',
        textMuted: '#a8a29e',
      },
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Indigo',
    description: 'Crisp, contemporary deep blue for seafood bistros, Mediterranean food, and modern lounges.',
    previewAccent: '#4338ca',
    config: {
      presetId: 'ocean',
      light: {
        primary: '#4338ca',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#0f172a',
        textMuted: '#64748b',
      },
      dark: {
        primary: '#6366f1',
        background: '#09090b',
        surface: '#111322',
        text: '#f8fafc',
        textMuted: '#94a3b8',
      },
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Minimal',
    description: 'High-contrast monochrome palette for sushi bars, luxury venues, and minimalist brands.',
    previewAccent: '#18181b',
    config: {
      presetId: 'midnight',
      light: {
        primary: '#18181b',
        background: '#f4f4f5',
        surface: '#ffffff',
        text: '#09090b',
        textMuted: '#71717a',
      },
      dark: {
        primary: '#e4e4e7',
        background: '#09090b',
        surface: '#18181b',
        text: '#fafafa',
        textMuted: '#a1a1aa',
      },
    },
  },
];

export const DEFAULT_STOREFRONT_THEME: StorefrontThemeConfig = STOREFRONT_THEME_PRESETS[0].config;

