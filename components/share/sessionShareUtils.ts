import type { SessionEvent, SessionRecord } from '@/types';

export interface SessionShareInput {
  quality_score: number;
  actual_duration: number;
  pause_count: number;
  left_app_count: number;
  started_at: string;
  task_title?: string | null;
  events?: SessionEvent[];
}

export function sessionRecordToShareInput(s: SessionRecord): SessionShareInput {
  const tasksData = s.tasks;
  const taskName = Array.isArray(tasksData)
    ? (tasksData[0]?.title ?? null)
    : ((tasksData as { title?: string } | null)?.title ?? null);

  return {
    quality_score: s.quality_score ?? 0,
    actual_duration: s.actual_duration,
    pause_count: s.pause_count ?? 0,
    left_app_count: s.left_app_count ?? 0,
    started_at: s.started_at ?? s.ended_at,
    task_title: taskName,
    events: [],
  };
}
