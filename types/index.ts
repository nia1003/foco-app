// ─────────────────────────────────────────────
// Global Type Definitions
// ─────────────────────────────────────────────

import type { PetType } from '@/constants/config';

// ── Auth ──────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  username: string;
}

// ── User & Profile ────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

// ── Pet ───────────────────────────────────────
export interface Pet {
  id: string;
  name: string;
  type: PetType;
  level: number;
  experience: number;
  happiness: number; // 0–100
  hunger: number;    // 0–100
  avatarUrl?: string;
}

// ── Farm ──────────────────────────────────────
export interface FarmPlot {
  id: string;
  crop: string | null;
  plantedAt: string | null;
  harvestAt: string | null;
  state: 'empty' | 'growing' | 'ready';
}

// ── Missions ──────────────────────────────────
export type MissionStatus = 'idle' | 'active' | 'accomplished' | 'failed';

export interface Mission {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  remainingSeconds: number;
  reward: MissionReward;
  status: MissionStatus;
}

export interface MissionReward {
  experience: number;
  coins: number;
  items?: BackpackItem[];
}

// ── Backpack ──────────────────────────────────
export interface BackpackItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'food' | 'tool' | 'decoration' | 'seed';
  iconUrl?: string;
}

// ── Stats ─────────────────────────────────────
export interface UserStats {
  totalCoins: number;
  totalMissionsCompleted: number;
  longestStreak: number;
  currentStreak: number;
  level: number;
  experience: number;
  nextLevelExp: number;
}

// ── API Response wrapper ───────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}
