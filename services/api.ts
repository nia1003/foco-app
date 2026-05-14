// ─────────────────────────────────────────────
// API Client — Axios 封裝，自動帶 Token & 錯誤處理
// ─────────────────────────────────────────────
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TOKEN_KEY } from '@/constants/config';
import type { ApiError } from '@/types';

const client: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor：自動附加 Access Token ───
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor：統一錯誤處理 ───────────
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; code?: string }>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message ?? error.message ?? '未知錯誤',
      code: error.response?.data?.code ?? 'UNKNOWN',
      statusCode: error.response?.status ?? 0,
    };
    return Promise.reject(apiError);
  },
);

// ── Generic HTTP helpers ──────────────────────
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    client.get<T>(url, config).then((r) => r.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    client.post<T>(url, data, config).then((r) => r.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    client.put<T>(url, data, config).then((r) => r.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    client.patch<T>(url, data, config).then((r) => r.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    client.delete<T>(url, config).then((r) => r.data),
};

export default client;
