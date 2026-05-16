// ─────────────────────────────────────────────
// Pet Store — 寵物狀態（FOCO 版）
// ─────────────────────────────────────────────
import { create } from 'zustand';
import type { FocoPet } from '@/types';

interface PetStore {
  pet: FocoPet | null;
  setPet: (pet: FocoPet) => void;
  /** Session 結束後，直接套用後端回傳的新 XP / Level */
  applySessionResult: (newXP: number, newLevel: number, xpNextLevel: number) => void;
  reset: () => void;
}

export const usePetStore = create<PetStore>((set) => ({
  pet: null,

  setPet: (pet) => set({ pet }),

  applySessionResult: (newXP, newLevel, xpNextLevel) =>
    set((state) => ({
      pet: state.pet
        ? { ...state.pet, xp: newXP, level: newLevel, xp_next_level: xpNextLevel }
        : null,
    })),

  reset: () => set({ pet: null }),
}));
