import { useEffect } from 'react';

/**
 * Custom React hook that locks document body and HTML element scrolling
 * whenever a modal, slide-over drawer, or dialog popup is active.
 * Restores previous overflow styles cleanly upon unmount/deactivation.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isLocked]);
}
