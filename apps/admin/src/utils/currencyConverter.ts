import { useQuery } from '@tanstack/react-query';
import { useAdminScopeStore } from '../store/useAdminScopeStore.ts';

export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
};

// Fallback conversion table: 1 INR = X target currency
export const FALLBACK_RATES_FROM_INR: Record<SupportedCurrency, number> = {
  INR: 1,
  USD: 0.0116, // ~86.20 INR/USD
  EUR: 0.0107, // ~93.45 INR/EUR
  GBP: 0.0092, // ~108.70 INR/GBP
  AED: 0.0426, // ~23.47 INR/AED
  CAD: 0.0163, // ~61.35 INR/CAD
};

let cachedRates: Record<string, number> = { ...FALLBACK_RATES_FROM_INR };
let lastFetchTime = 0;

/**
 * Fetches live real-time currency conversion rates from the open exchange rate API.
 * Free, open, no API key required, supported by European Central Bank rates.
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - lastFetchTime < 1000 * 60 * 30) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data?.result === 'success' && data?.rates) {
      cachedRates = data.rates;
      lastFetchTime = now;
      return cachedRates;
    }
  } catch (err) {
    console.warn('Live currency API unreachable, using robust fallback rates:', err);
  }

  return cachedRates;
}

/**
 * Converts a base INR amount to the target currency.
 */
export function convertFromInr(
  amountInInr: number,
  targetCurrency: SupportedCurrency,
  rates?: Record<string, number> | null,
): { amount: number; formatted: string; rate: number; isConverted: boolean } {
  const rate = rates?.[targetCurrency] ?? FALLBACK_RATES_FROM_INR[targetCurrency] ?? 1;
  const isConverted = targetCurrency !== 'INR';
  const converted = amountInInr * rate;
  const symbol = CURRENCIES[targetCurrency]?.symbol || targetCurrency;

  const formatted =
    targetCurrency === 'INR'
      ? `${symbol}${Math.round(converted).toLocaleString('en-IN')}`
      : `${symbol}${converted.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  return { amount: converted, formatted, rate, isConverted };
}

/**
 * React Hook for seamless currency conversion anywhere in the Admin UI.
 */
export function useCurrencyConverter() {
  const { selectedCurrency, setSelectedCurrency } = useAdminScopeStore();

  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ['admin-live-exchange-rates-inr'],
    queryFn: fetchLiveExchangeRates,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    refetchOnWindowFocus: false,
  });

  const formatAmount = (amountInInr: number) => {
    return convertFromInr(amountInInr, selectedCurrency, rates);
  };

  return {
    selectedCurrency,
    setSelectedCurrency,
    formatAmount,
    currencyConfig: CURRENCIES[selectedCurrency] || CURRENCIES.INR,
    rates,
    ratesLoading,
  };
}
