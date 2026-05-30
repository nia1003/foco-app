import type { SessionPayload } from '@/types';

export function calculateQualityScore(payload: SessionPayload): number {
  const completionRatio =
    typeof payload.completion_percent === 'number'
      ? Math.max(0, Math.min(100, payload.completion_percent)) / 100
      : payload.planned_duration > 0
        ? Math.min(payload.actual_duration / payload.planned_duration, 1)
        : 1;

  if (payload.early_stop) return Math.round(completionRatio * 40);

  let score = Math.round(completionRatio * 70);
  if (payload.completed) score += 15;
  score -= Math.min(payload.pause_count * 5, 20);
  score -= Math.min(payload.left_app_count * 8, 25);
  if (payload.left_app_total_sec > 120) score -= 10;

  return Math.max(0, Math.min(100, score));
}
