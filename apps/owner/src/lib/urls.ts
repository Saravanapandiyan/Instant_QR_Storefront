/**
 * Customer Storefront URL helper
 * Resolves the public customer-facing storefront URL
 */

export function getCustomerBaseUrl(): string {
  // 1. In browser runtime, dynamically adapt to whatever domain/origin the app is running on:
  if (typeof window !== 'undefined' && window.location?.origin) {
    // In standalone local Vite development (where owner runs on port 5173), customer runs on 5174
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:5174`;
    }
    // In all live servers, Docker, custom domains, direct IPs, and reverse proxies (e.g. Caddy/Nginx),
    // the customer storefront is served directly on the same origin (root /)
    return window.location.origin.replace(/\/+$/, '');
  }

  // 2. Fallback if explicitly configured in environment variable
  const envUrl = import.meta.env.VITE_CUSTOMER_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Fallback for local Vite development
  return 'http://localhost:5174';
}

export const CUSTOMER_APP_URL: string = getCustomerBaseUrl();

import { apiClient } from './api-client';

export function getCustomerStorefrontUrl(
  branchSlug: string,
  tableNumber?: string | number
): string {
  const baseUrl = getCustomerBaseUrl();
  const cleanSlug = (branchSlug || '').replace(/^\/+/, '');
  const url = `${baseUrl}/r/${cleanSlug}`;
  if (tableNumber !== undefined && tableNumber !== null && String(tableNumber).trim() !== '') {
    return `${url}?table=${encodeURIComponent(String(tableNumber).trim())}`;
  }
  return url;
}

export function getEncryptedStorefrontUrl(token: string): string {
  const baseUrl = getCustomerBaseUrl();
  return `${baseUrl}/s/${encodeURIComponent(token)}`;
}

export async function fetchEncryptedQrTokens(
  branchSlug: string,
  tableNumbers?: string[],
): Promise<{ baseToken: string; tableTokens: Record<string, string> }> {
  return apiClient.post<{ baseToken: string; tableTokens: Record<string, string> }>(
    '/branches/qr-tokens',
    { branchSlug, tableNumbers },
  );
}
