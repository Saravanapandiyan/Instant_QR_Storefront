import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 4000,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  success: (message, title = 'Success') => {
    return get().addToast({ type: 'success', title, message });
  },

  error: (message, title = 'Error') => {
    return get().addToast({ type: 'error', title, message });
  },

  info: (message, title = 'Info') => {
    return get().addToast({ type: 'info', title, message });
  },

  warning: (message, title = 'Warning') => {
    return get().addToast({ type: 'warning', title, message });
  },
}));

// Direct helper export for easy calling inside callbacks/services
export const toast = {
  success: (message: string, title?: string) => useToastStore.getState().success(message, title),
  error: (message: string, title?: string) => useToastStore.getState().error(message, title),
  info: (message: string, title?: string) => useToastStore.getState().info(message, title),
  warning: (message: string, title?: string) => useToastStore.getState().warning(message, title),
};
