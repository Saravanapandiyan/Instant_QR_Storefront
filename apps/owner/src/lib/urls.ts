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

import { useEffect, useState } from 'react';
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

export function getCustomerDisplayHost(): string {
  return getCustomerBaseUrl().replace(/^https?:\/\//, '');
}

/**
 * Fetches encrypted /s/:token storefront paths for a list of branch slugs.
 */
export function useEncryptedBranchTokens(slugs: string[]) {
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const slugKey = slugs.filter(Boolean).sort().join('|');

  useEffect(() => {
    const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
    if (uniqueSlugs.length === 0) return;

    let cancelled = false;
    Promise.all(
      uniqueSlugs.map(async (slug) => {
        try {
          const res = await fetchEncryptedQrTokens(slug);
          return [slug, res.baseToken] as const;
        } catch {
          return null;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      const map: Record<string, string> = {};
      for (const entry of entries) {
        if (entry && entry[1]) {
          map[entry[0]] = entry[1];
        }
      }
      setTokens(map);
    });

    return () => {
      cancelled = true;
    };
  }, [slugKey]);

  const getBranchStorefrontHref = (slug: string) => {
    const token = tokens[slug];
    return token ? getEncryptedStorefrontUrl(token) : getCustomerStorefrontUrl(slug);
  };

  const getBranchDisplayPath = (slug: string) => {
    const token = tokens[slug];
    return token ? `/s/${token}` : `/r/${slug}`;
  };

  return { getBranchStorefrontHref, getBranchDisplayPath };
}
