import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthResponse } from '@instant-qr/shared-types';
import { queryClient } from '../lib/queryClient';
import { useActiveStore } from './useActiveStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (data: AuthResponse) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (data: AuthResponse) => {
        // Clear previous user's query cache and active store
        try {
          queryClient.clear();
          useActiveStore.getState().resetActiveStore();
        } catch {
          // ignore
        }
        set({
          user: data.user,
          token: data.accessToken,
          isAuthenticated: true,
        });
      },

      setUser: (user: User) =>
        set({
          user,
        }),

      logout: () => {
        // Wipe all cached data for previous session completely
        try {
          queryClient.clear();
          useActiveStore.getState().resetActiveStore();
        } catch {
          // ignore
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'instant-qr-owner-auth',
    }
  )
);
