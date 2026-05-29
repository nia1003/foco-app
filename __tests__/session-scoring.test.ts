import { calculateQualityScore } from '@/lib/sessionScoring';
import type { SessionPayload } from '@/types';

const basePayload: SessionPayload = {
  user_id: 'user-1',
  pet_id: 'pet-1',
  task_id: null,
  planned_duration: 1500,
  actual_duration: 1500,
  pause_count: 0,
  pause_total_sec: 0,
  left_app_count: 0,
  left_app_total_sec: 0,
  completed: true,
  early_stop: false,
  started_at: '2026-05-29T00:00:00.000Z',
  events: [],
};

describe('calculateQualityScore', () => {
  it.each([
    ['clean completed session', { completion_percent: 100 }, 85],
    ['partial reflection completion', { completion_percent: 50, completed: false }, 35],
    ['interrupted completed session', { completion_percent: 100, pause_count: 2, left_app_count: 1 }, 67],
    ['long app switch penalty', { completion_percent: 100, left_app_total_sec: 121 }, 75],
    ['early stop caps score', { completion_percent: 80, early_stop: true, completed: false }, 32],
    ['clamps low scores', { completion_percent: 0, pause_count: 99, left_app_count: 99, left_app_total_sec: 999 }, 0],
    ['clamps completion percent above 100', { completion_percent: 140 }, 85],
  ])('%s', (_name, overrides: Partial<SessionPayload>, expected) => {
    expect(calculateQualityScore({ ...basePayload, ...overrides })).toBe(expected);
  });

  it('is deterministic for identical payloads', () => {
    const payload = {
      ...basePayload,
      completion_percent: 85,
      mood_score: 4,
      distraction_reasons: ['phone', 'noise'],
      completed: false,
      pause_count: 1,
      left_app_count: 2,
    };

    const scores = Array.from({ length: 100 }, () => calculateQualityScore(payload));

    expect(new Set(scores)).toEqual(new Set([39]));
  });
});
