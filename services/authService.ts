// ─────────────────────────────────────────────
// Auth Service — 登入 / 註冊 / 刷新 Token
// ─────────────────────────────────────────────
import { api } from './api';
import type {
  AuthTokens,
  LoginPayload,
  SignupPayload,
  UserProfile,
  ApiResponse,
} from '@/types';

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<{ tokens: AuthTokens; user: UserProfile }>>(
      '/auth/login',
      payload,
    ),

  signup: (payload: SignupPayload) =>
    api.post<ApiResponse<{ tokens: AuthTokens; user: UserProfile }>>(
      '/auth/signup',
      payload,
    ),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken }),

  getMe: () => api.get<ApiResponse<UserProfile>>('/auth/me'),
};
