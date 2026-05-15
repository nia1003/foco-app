import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore';
import type { AuthTokens, Mission, Pet, UserProfile, UserStats } from '@/types';

const profile: UserProfile = {
  id: 'user-1',
  email: 'nia@example.com',
  username: 'Nia',
  createdAt: '2026-05-15T00:00:00.000Z',
};

const tokens: AuthTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

const mission: Mission = {
  id: 'mission-1',
  title: 'Read Chapter 4',
  description: 'Study session',
  durationSeconds: 2,
  remainingSeconds: 2,
  reward: { experience: 25, coins: 5 },
  status: 'idle',
};

const pet: Pet = {
  id: 'pet-1',
  name: 'Mochi',
  type: 'rabbit',
  level: 1,
  experience: 0,
  happiness: 80,
  hunger: 20,
};

const stats: UserStats = {
  totalCoins: 0,
  totalMissionsCompleted: 0,
  longestStreak: 0,
  currentStreak: 0,
  level: 1,
  experience: 0,
  nextLevelExp: 100,
};

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    refreshToken: null,
    user: null,
  });
  useGameStore.getState().reset();
  useUserStore.getState().reset();
});

describe('authStore baseline', () => {
  it('starts unauthenticated and can login/logout', async () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    await useAuthStore.getState().login(tokens, profile);
    expect(useAuthStore.getState()).toEqual(
      expect.objectContaining({
        isAuthenticated: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: profile,
      }),
    );

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toEqual(
      expect.objectContaining({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        user: null,
      }),
    );
  });

  it('restores a persisted session token pair', async () => {
    await useAuthStore.getState().login(tokens, profile);
    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: true,
      accessToken: null,
      refreshToken: null,
      user: null,
    });

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState()).toEqual(
      expect.objectContaining({
        isAuthenticated: true,
        isLoading: false,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }),
    );
  });
});

describe('gameStore baseline', () => {
  it('starts empty and handles mission lifecycle actions', () => {
    expect(useGameStore.getState().missions).toEqual([]);
    expect(useGameStore.getState().activeMission).toBeNull();

    useGameStore.getState().setMissions([mission]);
    useGameStore.getState().startMission(mission);
    useGameStore.getState().tickMission();

    expect(useGameStore.getState().missions).toHaveLength(1);
    expect(useGameStore.getState().activeMission).toEqual(
      expect.objectContaining({ status: 'active', remainingSeconds: 1 }),
    );

    useGameStore.getState().completeMission();
    expect(useGameStore.getState().activeMission).toBeNull();
    expect(useGameStore.getState().accomplishedMissions[0]).toEqual(
      expect.objectContaining({ id: mission.id, status: 'accomplished' }),
    );
  });

  it('tracks top distractions by reason', () => {
    useGameStore.getState().recordDistraction('phone');
    useGameStore.getState().recordDistraction('phone');
    useGameStore.getState().recordDistraction('noise');

    expect(useGameStore.getState().getTopDistractions()).toEqual([
      { reason: 'phone', count: 2, pct: 2 / 3 },
      { reason: 'noise', count: 1, pct: 1 / 3 },
    ]);
  });
});

describe('userStore baseline', () => {
  it('starts empty and stores profile, pet, and stats', () => {
    expect(useUserStore.getState().profile).toBeNull();
    expect(useUserStore.getState().pet).toBeNull();
    expect(useUserStore.getState().stats).toBeNull();

    useUserStore.getState().setProfile(profile);
    useUserStore.getState().setPet(pet);
    useUserStore.getState().setStats(stats);

    expect(useUserStore.getState()).toEqual(
      expect.objectContaining({ profile, pet, stats }),
    );
  });

  it('adds experience and coins from the default stats baseline', () => {
    useUserStore.getState().addExperience(120);
    useUserStore.getState().addCoins(7);

    expect(useUserStore.getState().stats).toEqual(
      expect.objectContaining({
        level: 2,
        experience: 20,
        nextLevelExp: 140,
        totalCoins: 7,
      }),
    );
  });
});
