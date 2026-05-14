// ─────────────────────────────────────────────
// User Store — 玩家資料、寵物、統計
// ─────────────────────────────────────────────
import { create } from 'zustand';
import type { UserProfile, Pet, UserStats } from '@/types';

interface UserState {
  profile: UserProfile | null;
  pet: Pet | null;
  stats: UserStats | null;

  setProfile: (profile: UserProfile) => void;
  setPet: (pet: Pet) => void;
  updatePet: (patch: Partial<Pet>) => void;
  setStats: (stats: UserStats) => void;
  addExperience: (amount: number) => void;
  addCoins: (amount: number) => void;
  reset: () => void;
}

const DEFAULT_STATS: UserStats = {
  totalCoins: 0,
  totalMissionsCompleted: 0,
  longestStreak: 0,
  currentStreak: 0,
  level: 1,
  experience: 0,
  nextLevelExp: 100,
};

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  pet: null,
  stats: null,

  setProfile: (profile) => set({ profile }),

  setPet: (pet) => set({ pet }),

  updatePet: (patch) => {
    const current = get().pet;
    if (!current) return;
    set({ pet: { ...current, ...patch } });
  },

  setStats: (stats) => set({ stats }),

  addExperience: (amount) => {
    const stats = get().stats ?? DEFAULT_STATS;
    const newExp = stats.experience + amount;
    const leveledUp = newExp >= stats.nextLevelExp;
    set({
      stats: {
        ...stats,
        experience: leveledUp ? newExp - stats.nextLevelExp : newExp,
        level: leveledUp ? stats.level + 1 : stats.level,
        nextLevelExp: leveledUp
          ? Math.floor(stats.nextLevelExp * 1.4)
          : stats.nextLevelExp,
      },
    });
  },

  addCoins: (amount) => {
    const stats = get().stats ?? DEFAULT_STATS;
    set({ stats: { ...stats, totalCoins: stats.totalCoins + amount } });
  },

  reset: () => set({ profile: null, pet: null, stats: null }),
}));
