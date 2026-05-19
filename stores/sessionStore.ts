// ─────────────────────────────────────────────
// Session Store — 快取 sessions 資料
//
// 5 分鐘 stale window：
//   isStale() = true → 需要重新 fetch
//   isStale() = false → 直接用 cache，不打 API
// ─────────────────────────────────────────────
import { create } from 'zustand';
import type { SessionRecord } from '@/types';

const STALE_MS = 5 * 60 * 1000;

interface SessionSummary {
  total_focus_sec: number;
  streak_days: number;
  total_sessions: number;
}

const defaultSummary: SessionSummary = {
  total_focus_sec: 0,
  streak_days: 0,
  total_sessions: 0,
};

interface SessionState {
  sessions: SessionRecord[];
  summary: SessionSummary;
  lastFetchedAt: number | null;

  isStale: () => boolean;
  setData: (data: { sessions: SessionRecord[]; summary: SessionSummary }) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  summary: defaultSummary,
  lastFetchedAt: null,

  isStale: () => {
    const { lastFetchedAt } = get();
    return !lastFetchedAt || Date.now() - lastFetchedAt > STALE_MS;
  },

  setData: (data) => set({ ...data, lastFetchedAt: Date.now() }),

  reset: () => set({ sessions: [], summary: defaultSummary, lastFetchedAt: null }),
}));
