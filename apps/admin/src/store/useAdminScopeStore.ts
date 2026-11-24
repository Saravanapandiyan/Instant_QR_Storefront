import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedCurrency } from '../utils/currencyConverter.ts';

interface AdminScopeState {
  selectedRestaurantId: string | 'ALL';
  selectedBranchId: string | 'ALL';
  selectedCurrency: SupportedCurrency;
  setSelectedRestaurantId: (restaurantId: string | 'ALL') => void;
  setSelectedBranchId: (branchId: string | 'ALL') => void;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  resetScope: () => void;
}

export const useAdminScopeStore = create<AdminScopeState>()(
  persist(
    (set) => ({
      selectedRestaurantId: 'ALL',
      selectedBranchId: 'ALL',
      selectedCurrency: 'INR',

      setSelectedRestaurantId: (restaurantId: string | 'ALL') =>
        set({
          selectedRestaurantId: restaurantId,
          // Reset branch to ALL when switching restaurant or clearing to global
          selectedBranchId: 'ALL',
        }),

      setSelectedBranchId: (branchId: string | 'ALL') =>
        set({
          selectedBranchId: branchId,
        }),

      setSelectedCurrency: (currency: SupportedCurrency) =>
        set({
          selectedCurrency: currency,
        }),

      resetScope: () =>
        set({
          selectedRestaurantId: 'ALL',
          selectedBranchId: 'ALL',
        }),
    }),
    {
      name: 'instant-qr-admin-scope',
    }
  )
);
