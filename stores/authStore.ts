// ─────────────────────────────────────────────
// Auth Store — 登入狀態、Token 管理
// ─────────────────────────────────────────────
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/config';
import type { AuthTokens, UserProfile } from '@/types';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;

  // Actions
  login: (tokens: AuthTokens, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null,
  user: null,

  login: async (tokens, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    set({
      isAuthenticated: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  },

  restoreSession: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (accessToken && refreshToken) {
        set({ isAuthenticated: true, accessToken, refreshToken });
      }
    } catch {
      // Token 讀取失敗，保持未登入狀態
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));
