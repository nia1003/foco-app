// ─────────────────────────────────────────────
// Pet Store — 多寵物版本
//
// ● pets[]         所有屬於這個 user 的寵物
// ● activePetId    目前選中（陪伴專注）的寵物 ID
// ● activePet      computed: pets.find(id) ?? pets[0] ?? null
//
// activePetId 會寫入 AsyncStorage，重啟 App 後保留選擇
// ─────────────────────────────────────────────
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FocoPet } from '@/types';

const ACTIVE_PET_KEY = '@foco/activePetId';

interface PetStore {
  pets: FocoPet[];
  activePetId: string | null;

  // ── computed (derived, not stored) ───────────
  activePet: FocoPet | null;

  // ── actions ──────────────────────────────────
  /** 取代整個 pets 陣列（首次載入或刷新時使用） */
  setPets: (pets: FocoPet[]) => void;
  /** 選擇陪伴的寵物，並寫入 AsyncStorage */
  setActivePet: (petId: string) => Promise<void>;
  /** Session 結束後更新特定寵物的 XP / Level */
  applySessionResult: (
    petId: string,
    newXP: number,
    newLevel: number,
    xpNextLevel: number,
  ) => void;
  /** 從 AsyncStorage 恢復 activePetId */
  restoreActivePet: () => Promise<void>;
  reset: () => void;
}

function deriveActivePet(pets: FocoPet[], activePetId: string | null): FocoPet | null {
  if (!pets.length) return null;
  return pets.find((p) => p.id === activePetId) ?? pets[0];
}

export const usePetStore = create<PetStore>((set, get) => ({
  pets: [],
  activePetId: null,
  activePet: null,

  setPets: (pets) => {
    const activePetId = get().activePetId;
    set({ pets, activePet: deriveActivePet(pets, activePetId) });
  },

  setActivePet: async (petId) => {
    set((state) => ({
      activePetId: petId,
      activePet: deriveActivePet(state.pets, petId),
    }));
    try {
      await AsyncStorage.setItem(ACTIVE_PET_KEY, petId);
    } catch {}
  },

  applySessionResult: (petId, newXP, newLevel, xpNextLevel) =>
    set((state) => {
      const pets = state.pets.map((p) =>
        p.id === petId
          ? { ...p, xp: newXP, level: newLevel, xp_next_level: xpNextLevel }
          : p,
      );
      return { pets, activePet: deriveActivePet(pets, state.activePetId) };
    }),

  restoreActivePet: async () => {
    try {
      const stored = await AsyncStorage.getItem(ACTIVE_PET_KEY);
      if (stored) {
        set((state) => ({
          activePetId: stored,
          activePet: deriveActivePet(state.pets, stored),
        }));
      }
    } catch {}
  },

  reset: () => {
    set({ pets: [], activePetId: null, activePet: null });
    // 清除持久化的 activePetId，避免下次登入殘留上個帳號的選擇
    AsyncStorage.removeItem(ACTIVE_PET_KEY).catch(() => {});
  },
}));
