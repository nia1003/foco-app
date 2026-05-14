// ─────────────────────────────────────────────
// useAuth — 封裝登入、登出、Session 恢復邏輯
// ─────────────────────────────────────────────
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { authService } from '@/services/authService';
import type { LoginPayload, SignupPayload } from '@/types';

export function useAuth() {
  const router = useRouter();
  const { login, logout, isAuthenticated, isLoading, user } = useAuthStore();
  const { setProfile, reset: resetUser } = useUserStore();

  const handleLogin = useCallback(
    async (payload: LoginPayload) => {
      const res = await authService.login(payload);
      await login(res.data.tokens, res.data.user);
      setProfile(res.data.user);
      router.replace('/(app)/home');
    },
    [login, setProfile, router],
  );

  const handleSignup = useCallback(
    async (payload: SignupPayload) => {
      const res = await authService.signup(payload);
      await login(res.data.tokens, res.data.user);
      setProfile(res.data.user);
      // 繼續走 onboarding 流程
      router.replace('/(auth)/profile');
    },
    [login, setProfile, router],
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // 無論 API 成功與否都清除本地 Token
    } finally {
      await logout();
      resetUser();
      router.replace('/(auth)');
    }
  }, [logout, resetUser, router]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
  };
}
