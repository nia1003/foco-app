import { completeSession } from '@/services/focoService';
import type { SessionPayload } from '@/types';
import { getCurrentSession } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  clearLocalSupabaseSession: jest.fn(() => Promise.resolve()),
  getCurrentSession: jest.fn(() => Promise.resolve({ access_token: 'access-token' })),
  supabase: {
    functions: { invoke: jest.fn() },
    from: jest.fn(),
  },
}));

const payload: SessionPayload = {
  user_id: 'user-1',
  pet_id: 'pet-1',
  task_id: null,
  planned_duration: 1500,
  actual_duration: 10,
  pause_count: 0,
  pause_total_sec: 0,
  left_app_count: 0,
  left_app_total_sec: 0,
  completed: false,
  early_stop: false,
  started_at: '2026-05-29T00:00:00.000Z',
  events: [],
  completion_percent: 100,
};

describe('completeSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            session_id: 'session-1',
            pet_id: 'pet-1',
            xp_gained: 1,
            new_xp: 101,
            new_level: 2,
            level_up: false,
            focus_type: 'steadiness',
            xp_next_level: 250,
            quality_score: 0,
            ended_at: '2026-05-29T00:01:00.000Z',
          }),
      } as Response),
    );
  });

  it('normalizes stale zero scoring responses when reflection completion is high', async () => {
    const result = await completeSession(payload);

    expect(getCurrentSession).toHaveBeenCalledTimes(1);
    expect(result.quality_score).toBeGreaterThan(0);
    expect(result.quality_score).toBe(85);
  });

  it('rejects reward results for a different pet', async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          session_id: 'session-1',
          pet_id: 'pet-2',
          xp_gained: 10,
          new_xp: 110,
          new_level: 2,
          level_up: false,
          focus_type: 'steadiness',
          xp_next_level: 250,
          quality_score: 85,
          ended_at: '2026-05-29T00:01:00.000Z',
        }),
    } as Response);

    await expect(completeSession(payload)).rejects.toThrow('different companion');
  });

  it('rejects invalid reward data before the reward screen can use it', async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          session_id: 'session-1',
          pet_id: 'pet-1',
          xp_gained: 0,
          new_xp: 100,
          new_level: 2,
          level_up: false,
          focus_type: 'steadiness',
          xp_next_level: 250,
          quality_score: 85,
          ended_at: '2026-05-29T00:01:00.000Z',
        }),
    } as Response);

    await expect(completeSession(payload)).rejects.toThrow('reward data was invalid');
  });
});
