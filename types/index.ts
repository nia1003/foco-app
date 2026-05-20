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
export type TaskCategory = 'task' | 'daily';

export type TaskIconType = 'emoji' | 'svg';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  duration_min: number;
  status: 'pending' | 'done' | 'deleted';
  category?: TaskCategory;
  created_at: string;
  icon_type?: TaskIconType | null;
  icon_value?: string | null;
  /** @deprecated use icon_type + icon_value */
  emoji?: string;
  memo?: string;
  /** Cumulative completion 0–100 (persisted across sessions) */
  completion_percent?: number;
}

// sessions table（歷史清單用）
export interface SessionRecord {
  id: string;
  task_id?: string | null;
  actual_duration: number;   // 秒
  completed: boolean;
  focus_type_result: FocusType;
  xp_earned: number;
  ended_at: string;
  // 追蹤欄位（sessions table 儲存，歷史報告頁會用到）
  pause_count?: number;
  left_app_count?: number;
  quality_score?: number;
  started_at?: string;
  tasks?: { title: string }[] | { title: string } | null;  // join from tasks table (Supabase)
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
  events: SessionEvent[];      // 個別事件時間軸
  /** Reflection screen — distraction tag ids */
  distraction_reasons?: string[];
  /** Reflection screen — self-rated completion 0–100 */
  completion_percent?: number;
  /** Reflection screen — mood 1 (worst) – 5 (best) */
  mood_score?: number;
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
  started_at?: string;         // ISO string — 用於時間段顯示
  ended_at?: string;           // ISO string — Edge Function 回傳
  events?: SessionEvent[];     // 個別事件 — 用於時間軸視覺化
  old_xp?: number;             // 本次 session 前的 XP（用於進度條起始位置）
  task_title?: string;         // 完成的任務名稱
}

// 單次事件紀錄（在 useTimer 內部累積）
export interface SessionEvent {
  type: 'pause' | 'resume' | 'left_app' | 'returned';
  at: number; // Date.now() ms
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
  events: SessionEvent[];    // 個別事件時間軸
}

// ── Calendar / Day-log ────────────────────────
export interface SessionSummary {
  id: string;
  duration_min: number;
  task_title: string | null;
  quality_score: number;
  xp_earned: number;
  completed: boolean;
  started_at: string;
  ended_at: string;
}

export interface DayData {
  date: string;           // 'YYYY-MM-DD'
  session_count: number;
  /** Total focus seconds on this day (sum of session durations) */
  total_focus_sec: number;
  sessions: SessionSummary[];
}
