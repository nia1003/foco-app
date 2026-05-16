// ─────────────────────────────────────────────
// Auth Service — Supabase Auth 封裝
// ─────────────────────────────────────────────
import { supabase } from '@/lib/supabase';

export const authService = {
  /**
   * 註冊：建立 Supabase auth user。
   * name 會傳進 raw_user_meta_data，Trigger 自動建 public.users + pets。
   */
  signup: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return data;
  },

  /**
   * 登入：Email + Password。
   * 成功後 authStore.onAuthStateChange 自動更新狀態。
   */
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * 發送 OTP 驗證碼到 email（新用戶註冊用）
   */
  sendOtp: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  },

  /**
   * 驗證 OTP 碼
   */
  verifyOtp: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  },

  /** 登出 */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
