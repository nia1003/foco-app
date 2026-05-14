// ─────────────────────────────────────────────
// App-wide Configuration
// ─────────────────────────────────────────────

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://api.yourserver.com/v1';

export const TOKEN_KEY = 'farmpet_auth_token';
export const REFRESH_TOKEN_KEY = 'farmpet_refresh_token';

export const MISSION_TICK_INTERVAL_MS = 1000; // 每秒 tick

export const PET_TYPES = ['dog', 'cat', 'rabbit', 'hamster'] as const;
export type PetType = (typeof PET_TYPES)[number];

export const MISSION_STATUS = {
  IDLE: 'idle',
  ACTIVE: 'active',
  ACCOMPLISHED: 'accomplished',
  FAILED: 'failed',
} as const;
