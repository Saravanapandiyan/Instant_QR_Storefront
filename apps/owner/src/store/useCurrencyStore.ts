import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  type CurrencyConfig,
} from '../config/currencies.config';

interface CurrencyState {
  currentCurrency: CurrencyConfig;
  setCurrency: (code: string) => void;
  formatPrice: (amount: number | string | null | undefined, currencyCode?: string) => string;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currentCurrency: DEFAULT_CURRENCY,

      setCurrency: (code: string) => {
        const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
        if (found) {
          set({ currentCurrency: found });
        }
      },

      formatPrice: (amount, currencyCode) => {
        const num = Number(amount) || 0;
        const formatted = num.toFixed(2);
        const curr = currencyCode
          ? SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || get().currentCurrency
          : get().currentCurrency;
        return curr.position === 'prefix' ? `${curr.symbol}${formatted}` : `${formatted} ${curr.symbol}`;
      },
    }),
    {
      name: 'instant-qr-currency',
    }
  )
);
