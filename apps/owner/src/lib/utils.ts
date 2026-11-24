import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const rawBase = import.meta.env.VITE_API_BASE_URL || '';
  const serverOrigin = rawBase.replace(/\/api\/v1\/?$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (cleanPath.startsWith('uploads/')) {
    return `${serverOrigin}/${cleanPath}`;
  }
  return `${serverOrigin}/uploads/${cleanPath}`;
}
