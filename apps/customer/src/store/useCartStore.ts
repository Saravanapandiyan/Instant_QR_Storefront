import { create } from 'zustand';
import type { StorefrontItem, CartItem } from '../types/storefront.ts';

interface CartState {
  items: CartItem[];
  tableNumber: string | null;
  customerName: string;
  customerPhone: string;
  orderNotes: string;
  setTableNumber: (table: string | null) => void;
  setCustomerDetails: (name: string, phone: string, notes?: string) => void;
  addItem: (item: StorefrontItem) => void;
  addItemWithDetails: (item: StorefrontItem, quantity: number, notes?: string) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string) => number;
  getItemNotes: (itemId: string) => string;
  getTotalItemsCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableNumber: null,
  customerName: '',
  customerPhone: '',
  orderNotes: '',

  setTableNumber: (table) => set({ tableNumber: table }),

  setCustomerDetails: (name, phone, notes = '') =>
    set({ customerName: name, customerPhone: phone, orderNotes: notes }),

  addItem: (item) => {
    // If not available (Sold Out), do not allow adding
    if (!item.isAvailable) return;

    set((state) => {
      const existingIndex = state.items.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex].quantity += 1;
        return { items: updated };
      }
      return { items: [...state.items, { item, quantity: 1 }] };
    });
  },

  addItemWithDetails: (item, quantity, notes = '') => {
    if (!item.isAvailable || quantity <= 0) return;

    set((state) => {
      const existingIndex = state.items.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity,
          notes: notes.trim(),
        };
        return { items: updated };
      }
      return {
        items: [...state.items, { item, quantity, notes: notes.trim() }],
      };
    });
  },

  updateItemNotes: (itemId, notes) => {
    set((state) => ({
      items: state.items.map((ci) =>
        ci.item.id === itemId ? { ...ci, notes: notes.trim() } : ci
      ),
    }));
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((ci) => ci.item.id !== itemId),
    }));
  },

  updateQuantity: (itemId, delta) => {
    set((state) => {
      const updated = state.items
        .map((ci) => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];

      return { items: updated };
    });
  },

  clearCart: () => set({ items: [] }),

  getItemQuantity: (itemId) => {
    const found = get().items.find((ci) => ci.item.id === itemId);
    return found ? found.quantity : 0;
  },

  getItemNotes: (itemId) => {
    const found = get().items.find((ci) => ci.item.id === itemId);
    return found?.notes || '';
  },

  getTotalItemsCount: () => {
    return get().items.reduce((sum, ci) => sum + ci.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, ci) => {
      const price = Number(ci.item.finalPrice || ci.item.basePrice || 0);
      return sum + price * ci.quantity;
    }, 0);
  },
}));

