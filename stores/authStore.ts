// ─────────────────────────────────────────────
// Auth Store — Supabase session 管理
// 取代原本的 SecureStore JWT 版本
// ─────────────────────────────────────────────
import { create } from 'zustand';
import { clearLocalSupabaseSession, getCurrentSession, isStaleAuthSessionError, supabase } from '@/lib/supabase';
import { usePetStore } from '@/stores/petStore';

let authStateSubscription: { unsubscribe: () => void } | null = null;

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;

  restoreSession: () => Promise<void>;
  updateProfile: (payload: { name?: string; avatarUrl?: string | null }) => Promise<{ error?: string }>;
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
      const session = await getCurrentSession();

      set({
        isAuthenticated: !!session,
        userId: session?.user.id ?? null,
        userEmail: session?.user.email ?? null,
        userName: (session?.user.user_metadata?.name as string) ?? null,
        isLoading: false,
      });

      // 監聽後續的登入 / 登出事件
      authStateSubscription?.unsubscribe();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        set({
          isAuthenticated: !!session,
          userId: session?.user.id ?? null,
          userEmail: session?.user.email ?? null,
          userName: (session?.user.user_metadata?.name as string) ?? null,
        });
        // Clear pet cache on logout so a new user never sees the previous user's pets
        if (!session) usePetStore.getState().reset();
      });
      authStateSubscription = data.subscription;
    } catch (error) {
      if (isStaleAuthSessionError(error)) {
        await clearLocalSupabaseSession();
      }
      set({
        isAuthenticated: false,
        userId: null,
        userEmail: null,
        userName: null,
        isLoading: false,
      });
      usePetStore.getState().reset();
    }
  },

  updateProfile: async ({ name, avatarUrl }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: 'Not signed in' };

      const meta = { ...(user.user_metadata ?? {}) } as Record<string, unknown>;
      if (name !== undefined) meta.name = name.trim();
      if (avatarUrl !== undefined) {
        if (avatarUrl) meta.avatar_url = avatarUrl;
        else delete meta.avatar_url;
      }

      const { data, error } = await supabase.auth.updateUser({ data: meta });
      if (error) return { error: error.message };

      set({
        userName: (data.user?.user_metadata?.name as string) ?? null,
      });
      return {};
    } catch {
      return { error: 'Update failed' };
    }
  },

  logout: async () => {
    await supabase.auth.signOut().catch(async (error) => {
      if (isStaleAuthSessionError(error)) {
        await clearLocalSupabaseSession();
        return;
      }
      throw error;
    });
    set({ isAuthenticated: false, userId: null, userEmail: null, userName: null });
    usePetStore.getState().reset();
  },
}));
