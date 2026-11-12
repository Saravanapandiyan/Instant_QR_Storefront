/**
 * Customer Storefront URL helper
 * Resolves the public customer-facing storefront URL
 * (Configured via VITE_CUSTOMER_APP_URL, defaulting to http://localhost:5174 in dev)
 */
export const CUSTOMER_APP_URL: string = (
  import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174'
).replace(/\/+$/, '');

export function getCustomerStorefrontUrl(
  branchSlug: string,
  tableNumber?: string | number
): string {
  const cleanSlug = branchSlug.replace(/^\/+/, '');
  const url = `${CUSTOMER_APP_URL}/r/${cleanSlug}`;
  if (tableNumber !== undefined && tableNumber !== null && String(tableNumber).trim() !== '') {
    return `${url}?table=${encodeURIComponent(String(tableNumber).trim())}`;
  }
  return url;
}

