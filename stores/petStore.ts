// ─────────────────────────────────────────────
// Pet Store — 多寵物版本
//
// ● pets[]              所有屬於這個 user 的寵物
// ● activePetId         目前選中（陪伴專注）的寵物 ID（Supabase UUID）
// ● activePet           computed: pets.find(id) ?? pets[0] ?? null
//
// 持久化策略：
//   @foco/activePetId       — 上次選擇的 Supabase UUID（setActivePet 寫入）
//   @foco/onboardingPetName — Onboarding 選擇的寵物名稱（saveOnboardingPetName 寫入）
//     → restoreActivePet() 先嘗試 activePetId，若找不到則按名稱 auto-match
// ─────────────────────────────────────────────
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FocoPet } from '@/types';

const ACTIVE_PET_KEY = '@foco/activePetId';
const ONBOARDING_PET_NAME_KEY = '@foco/onboardingPetName';
const STALE_MS = 5 * 60 * 1000;

interface PetStore {
  pets: FocoPet[];
  activePetId: string | null;
  petsLastFetchedAt: number | null;

  // ── computed (derived, not stored) ───────────
  activePet: FocoPet | null;

  // ── actions ──────────────────────────────────
  /** 取代整個 pets 陣列（首次載入或刷新時使用），同時更新 lastFetchedAt */
  setPets: (pets: FocoPet[]) => void;
  isPetsStale: () => boolean;
  /** 選擇陪伴的寵物，並寫入 AsyncStorage */
  setActivePet: (petId: string) => Promise<void>;
  /** Onboarding 選寵物時呼叫，儲存名稱供首次載入自動匹配 */
  saveOnboardingPetName: (name: string) => Promise<void>;
  /** Session 結束後更新特定寵物的 XP / Level */
  applySessionResult: (
    petId: string,
    newXP: number,
    newLevel: number,
    xpNextLevel: number,
  ) => void;
  /**
   * 從 AsyncStorage 恢復 activePetId。
   * 若儲存的 UUID 仍在 pets 中 → 直接使用。
   * 若找不到（首次登入）→ 嘗試按 onboardingPetName 自動匹配。
   * 需在 setPets() 之後呼叫，才有 pets 可以比對。
   */
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
  petsLastFetchedAt: null,

  isPetsStale: () => {
    const { petsLastFetchedAt } = get();
    return !petsLastFetchedAt || Date.now() - petsLastFetchedAt > STALE_MS;
  },

  setPets: (pets) => {
    const activePetId = get().activePetId;
    set({ pets, activePet: deriveActivePet(pets, activePetId), petsLastFetchedAt: Date.now() });
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

  saveOnboardingPetName: async (name) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_PET_NAME_KEY, name);
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
    const { pets } = get();
    try {
      const storedId = await AsyncStorage.getItem(ACTIVE_PET_KEY);
      if (storedId && pets.find((p) => p.id === storedId)) {
        set({ activePetId: storedId, activePet: deriveActivePet(pets, storedId) });
        return;
      }

      // UUID not found — try matching by onboarding pet name
      const onboardingName = await AsyncStorage.getItem(ONBOARDING_PET_NAME_KEY);
      if (onboardingName) {
        const matched = pets.find(
          (p) => p.name.toLowerCase() === onboardingName.toLowerCase(),
        );
        if (matched) {
          set({ activePetId: matched.id, activePet: matched });
          await AsyncStorage.setItem(ACTIVE_PET_KEY, matched.id);
          return;
        }
      }
    } catch {}
    // Final fallback: use first pet (already set by setPets via deriveActivePet)
  },

  reset: () => {
    set({ pets: [], activePetId: null, activePet: null, petsLastFetchedAt: null });
    AsyncStorage.multiRemove([ACTIVE_PET_KEY, ONBOARDING_PET_NAME_KEY]).catch(() => {});
  },
}));
