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

// ─────────────────────────────────────────────
// FOCO 專用型別
// ─────────────────────────────────────────────

export type FocusType =
  | 'conscientiousness'
  | 'dominance'
  | 'steadiness'
  | 'influence';

// Supabase pets table 的資料結構
export interface FocoPet {
  id: string;
  owner_id: string;
  name: string;
  level: number;       // 1–5
  xp: number;
  xp_next_level: number;
}

// tasks table
export interface Task {
  id: string;
  user_id: string;
  title: string;
  duration_min: number;
  status: 'pending' | 'done' | 'deleted';
  created_at: string;
  // local-only fields (not yet persisted to DB)
  emoji?: string;
  memo?: string;
}

// sessions table（歷史清單用）
export interface SessionRecord {
  id: string;
  actual_duration: number;   // 秒
  completed: boolean;
  focus_type_result: FocusType;
  xp_earned: number;
  ended_at: string;
  // 追蹤欄位（sessions table 儲存，歷史報告頁會用到）
  pause_count?: number;
  left_app_count?: number;
}

// POST /functions/v1/session-complete 的 request body
export interface SessionPayload {
  user_id: string;
  pet_id: string;              // 本次陪伴的寵物 ID
  task_id: string | null;
  planned_duration: number;    // 秒
  actual_duration: number;     // 秒
  pause_count: number;
  pause_total_sec: number;
  left_app_count: number;
  left_app_total_sec: number;
  completed: boolean;
  early_stop: boolean;
  started_at: string;          // ISO string
}

// Edge Function 回傳（+ focus.tsx 補充的本地計時統計）
export interface SessionResult {
  session_id: string;
  pet_id: string;              // 哪隻寵物獲得 XP
  xp_gained: number;
  new_xp: number;
  new_level: number;
  level_up: boolean;
  focus_type: FocusType;
  xp_next_level: number;
  quality_score: number;       // 0–100 品質分數
  // 由 focus.tsx 在導航前合併進來，讓 analysis 頁可以顯示
  actual_duration?: number;
  pause_count?: number;
  left_app_count?: number;
}

// useTimer.getSnapshot() 的快照格式
export interface TimerSnapshot {
  plannedDuration: number;   // 秒
  startedAt: number;         // Date.now()
  pauseCount: number;
  pauseTotalSec: number;
  leftAppCount: number;
  leftAppTotalSec: number;
  taskId: string | null;
}
