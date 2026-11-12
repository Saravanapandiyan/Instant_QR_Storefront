import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-[8px] transition-colors border border-border bg-surface text-text hover:bg-surface-2 hover:border-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${className}`}
    >
      {theme === 'dark' ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
};
