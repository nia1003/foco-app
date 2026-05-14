// ─────────────────────────────────────────────
// Game Store — 任務、農場、背包
// ─────────────────────────────────────────────
import { create } from 'zustand';
import type { Mission, FarmPlot, BackpackItem } from '@/types';

interface GameState {
  // Missions
  missions: Mission[];
  activeMission: Mission | null;
  accomplishedMissions: Mission[];

  // Distraction HashMap: reason → count  (O(1) 查詢與更新)
  distractionMap: Record<string, number>;

  // Farm
  farmPlots: FarmPlot[];

  // Backpack
  backpackItems: BackpackItem[];

  // Mission Actions
  setMissions: (missions: Mission[]) => void;
  startMission: (mission: Mission) => void;
  tickMission: () => void;
  completeMission: () => void;
  failMission: () => void;

  // Distraction Actions
  recordDistraction: (reason: string) => void;
  getTopDistractions: () => Array<{ reason: string; count: number; pct: number }>;

  // Farm Actions
  setFarmPlots: (plots: FarmPlot[]) => void;
  plantCrop: (plotId: string, crop: string, durationMs: number) => void;
  harvestPlot: (plotId: string) => void;

  // Backpack Actions
  setBackpackItems: (items: BackpackItem[]) => void;
  addBackpackItem: (item: BackpackItem) => void;
  useBackpackItem: (itemId: string, quantity?: number) => void;

  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  missions: [],
  activeMission: null,
  accomplishedMissions: [],
  distractionMap: {},
  farmPlots: [],
  backpackItems: [],

  // ── Mission ──────────────────────────────────

  setMissions: (missions) => set({ missions }),

  startMission: (mission) => {
    const active: Mission = { ...mission, status: 'active' };
    set({ activeMission: active });
  },

  tickMission: () => {
    const { activeMission } = get();
    if (!activeMission || activeMission.status !== 'active') return;

    const remaining = activeMission.remainingSeconds - 1;
    if (remaining <= 0) {
      set({
        activeMission: { ...activeMission, remainingSeconds: 0, status: 'accomplished' },
      });
    } else {
      set({ activeMission: { ...activeMission, remainingSeconds: remaining } });
    }
  },

  completeMission: () => {
    const { activeMission, accomplishedMissions } = get();
    if (!activeMission) return;
    const done: Mission = { ...activeMission, status: 'accomplished' };
    set({
      accomplishedMissions: [done, ...accomplishedMissions],
      activeMission: null,
    });
  },

  failMission: () => {
    const { activeMission } = get();
    if (!activeMission) return;
    set({ activeMission: { ...activeMission, status: 'failed' } });
    setTimeout(() => set({ activeMission: null }), 2000);
  },

  // ── Distraction HashMap ───────────────────────
  // O(1) 更新：直接以 reason 為 key，count +1
  recordDistraction: (reason) => {
    const map = get().distractionMap;
    set({ distractionMap: { ...map, [reason]: (map[reason] ?? 0) + 1 } });
  },

  // 回傳排序後的分心清單，附上百分比
  getTopDistractions: () => {
    const map = get().distractionMap;
    const total = Object.values(map).reduce((s, n) => s + n, 0);
    if (total === 0) return [];
    return Object.entries(map)
      .map(([reason, count]) => ({ reason, count, pct: count / total }))
      .sort((a, b) => b.count - a.count);
  },

  // ── Farm ─────────────────────────────────────

  setFarmPlots: (farmPlots) => set({ farmPlots }),

  plantCrop: (plotId, crop, durationMs) => {
    const now = new Date().toISOString();
    const harvestAt = new Date(Date.now() + durationMs).toISOString();
    set({
      farmPlots: get().farmPlots.map((p) =>
        p.id === plotId
          ? { ...p, crop, plantedAt: now, harvestAt, state: 'growing' }
          : p,
      ),
    });
  },

  harvestPlot: (plotId) => {
    set({
      farmPlots: get().farmPlots.map((p) =>
        p.id === plotId
          ? { ...p, crop: null, plantedAt: null, harvestAt: null, state: 'empty' }
          : p,
      ),
    });
  },

  // ── Backpack ──────────────────────────────────

  setBackpackItems: (backpackItems) => set({ backpackItems }),

  addBackpackItem: (item) => {
    const existing = get().backpackItems.find((i) => i.id === item.id);
    if (existing) {
      set({
        backpackItems: get().backpackItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i,
        ),
      });
    } else {
      set({ backpackItems: [...get().backpackItems, item] });
    }
  },

  useBackpackItem: (itemId, quantity = 1) => {
    set({
      backpackItems: get()
        .backpackItems.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i,
        )
        .filter((i) => i.quantity > 0),
    });
  },

  reset: () =>
    set({
      missions: [],
      activeMission: null,
      accomplishedMissions: [],
      distractionMap: {},
      farmPlots: [],
      backpackItems: [],
    }),
}));
