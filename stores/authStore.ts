// ─────────────────────────────────────────────
// Auth Store — Supabase session 管理
// 取代原本的 SecureStore JWT 版本
// ─────────────────────────────────────────────
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { usePetStore } from '@/stores/petStore';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;

  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  userEmail: null,
  userName: null,

  restoreSession: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        isAuthenticated: !!session,
        userId: session?.user.id ?? null,
        userEmail: session?.user.email ?? null,
        userName: (session?.user.user_metadata?.name as string) ?? null,
        isLoading: false,
      });

      // 監聽後續的登入 / 登出事件
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          isAuthenticated: !!session,
          userId: session?.user.id ?? null,
          userEmail: session?.user.email ?? null,
          userName: (session?.user.user_metadata?.name as string) ?? null,
        });
        // Clear pet cache on logout so a new user never sees the previous user's pets
        if (!session) usePetStore.getState().reset();
      });
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, userId: null, userEmail: null, userName: null });
    usePetStore.getState().reset();
  },
}));
