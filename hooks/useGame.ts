// ─────────────────────────────────────────────
// useGame — 初始化並同步遊戲資料
// ─────────────────────────────────────────────
import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore';
import { gameService } from '@/services/gameService';

export function useGameInit() {
  const { setMissions, setFarmPlots, setBackpackItems } = useGameStore();
  const { setPet, setStats } = useUserStore();

  useEffect(() => {
    const init = async () => {
      const [missionsRes, farmRes, backpackRes, petRes, statsRes] =
        await Promise.allSettled([
          gameService.getMissions(),
          gameService.getFarmPlots(),
          gameService.getBackpack(),
          gameService.getPet(),
          gameService.getStats(),
        ]);

      if (missionsRes.status === 'fulfilled') setMissions(missionsRes.value.data);
      if (farmRes.status === 'fulfilled') setFarmPlots(farmRes.value.data);
      if (backpackRes.status === 'fulfilled') setBackpackItems(backpackRes.value.data);
      if (petRes.status === 'fulfilled') setPet(petRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    };

    init();
  }, [setMissions, setFarmPlots, setBackpackItems, setPet, setStats]);
}

export function useMissionTimer() {
  const { activeMission, tickMission, completeMission } = useGameStore();
  const { addExperience, addCoins } = useUserStore();

  useEffect(() => {
    if (!activeMission || activeMission.status !== 'active') return;

    const interval = setInterval(() => {
      tickMission();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMission, tickMission]);

  useEffect(() => {
    if (activeMission?.status === 'accomplished') {
      addExperience(activeMission.reward.experience);
      addCoins(activeMission.reward.coins);
      completeMission();
    }
  }, [activeMission, completeMission, addExperience, addCoins]);
}
