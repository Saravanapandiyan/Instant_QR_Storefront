export function getAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, '');
  }
  const clean = url.replace(/^\/?(uploads\/)?/, '');
  return `/uploads/${clean}`;
}
