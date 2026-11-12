import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdminTheme = 'light' | 'dark';

interface AdminThemeState {
  theme: AdminTheme;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

export const applyAdminThemeToDOM = (theme: AdminTheme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
};

export const useAdminThemeStore = create<AdminThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light', // Default to clean, professional enterprise light mode

      toggleTheme: () => {
        const nextTheme: AdminTheme = get().theme === 'dark' ? 'light' : 'dark';
        applyAdminThemeToDOM(nextTheme);
        set({ theme: nextTheme });
      },

      setTheme: (theme: AdminTheme) => {
        applyAdminThemeToDOM(theme);
        set({ theme });
      },
    }),
    {
      name: 'instant-qr-admin-theme', // Dedicated isolated localStorage key for Admin Panel
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyAdminThemeToDOM(state.theme);
        }
      },
    }
  )
);

// Apply immediately on initial script evaluation
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('instant-qr-admin-theme');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.theme) {
        applyAdminThemeToDOM(parsed.state.theme);
      }
    } else {
      applyAdminThemeToDOM('light');
    }
  } catch {
    applyAdminThemeToDOM('light');
  }
}
