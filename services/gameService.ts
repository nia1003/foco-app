// ─────────────────────────────────────────────
// Game Service — 任務、農場、背包 API
// ─────────────────────────────────────────────
import { api } from './api';
import type {
  Mission,
  FarmPlot,
  BackpackItem,
  Pet,
  UserStats,
  ApiResponse,
} from '@/types';

export const gameService = {
  // Missions
  getMissions: () => api.get<ApiResponse<Mission[]>>('/missions'),
  startMission: (missionId: string) =>
    api.post<ApiResponse<Mission>>(`/missions/${missionId}/start`),
  completeMission: (missionId: string) =>
    api.post<ApiResponse<Mission>>(`/missions/${missionId}/complete`),

  // Farm
  getFarmPlots: () => api.get<ApiResponse<FarmPlot[]>>('/farm/plots'),
  plantCrop: (plotId: string, crop: string) =>
    api.post<ApiResponse<FarmPlot>>(`/farm/plots/${plotId}/plant`, { crop }),
  harvestPlot: (plotId: string) =>
    api.post<ApiResponse<FarmPlot>>(`/farm/plots/${plotId}/harvest`),

  // Backpack
  getBackpack: () => api.get<ApiResponse<BackpackItem[]>>('/backpack'),

  // Pet
  getPet: () => api.get<ApiResponse<Pet>>('/pet'),
  updatePet: (patch: Partial<Pet>) => api.patch<ApiResponse<Pet>>('/pet', patch),

  // Stats
  getStats: () => api.get<ApiResponse<UserStats>>('/stats'),
};
