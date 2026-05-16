// ─────────────────────────────────────────────
// Auth Store — Supabase session 管理
// 取代原本的 SecureStore JWT 版本
// ─────────────────────────────────────────────
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;

  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  userEmail: null,

  restoreSession: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        isAuthenticated: !!session,
        userId: session?.user.id ?? null,
        userEmail: session?.user.email ?? null,
        isLoading: false,
      });

      // 監聽後續的登入 / 登出事件
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          isAuthenticated: !!session,
          userId: session?.user.id ?? null,
          userEmail: session?.user.email ?? null,
        });
      });
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, userId: null, userEmail: null });
  },
}));
