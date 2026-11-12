import { create } from 'zustand';

interface ActiveStoreState {
  activeRestaurantId: string | null;
  activeBranchId: string | null;
  setActiveRestaurantId: (id: string | null) => void;
  setActiveBranchId: (id: string | null) => void;
}

export const useActiveStore = create<ActiveStoreState>((set) => {
  const savedRestaurantId = localStorage.getItem('activeRestaurantId') || null;
  const savedBranchId = localStorage.getItem('activeBranchId') || null;

  return {
    activeRestaurantId: savedRestaurantId,
    activeBranchId: savedBranchId,

    setActiveRestaurantId: (id) => {
      if (id) {
        localStorage.setItem('activeRestaurantId', id);
      } else {
        localStorage.removeItem('activeRestaurantId');
      }
      set({ activeRestaurantId: id });
    },

    setActiveBranchId: (id) => {
      if (id) {
        localStorage.setItem('activeBranchId', id);
      } else {
        localStorage.removeItem('activeBranchId');
      }
      set({ activeBranchId: id });
    },
  };
});
