// ─────────────────────────────────────────────
// FOCO Service — Session / Pet / Task API
// 全部走 Supabase（DB + Edge Function）
// ─────────────────────────────────────────────
import { supabase } from '@/lib/supabase';
import type { SessionPayload, SessionResult, FocoPet, Task, SessionRecord } from '@/types';

// ── 等級門檻（index = level - 1）────────────────
const XP_THRESHOLDS = [0, 100, 250, 500, 900];

function xpNextLevel(level: number): number {
  return level < 5 ? XP_THRESHOLDS[level] : 900;
}

// ── session-complete（呼叫 Supabase Edge Function）
export async function completeSession(payload: SessionPayload): Promise<SessionResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/session-complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'session-complete failed');
  }

  return res.json() as Promise<SessionResult>;
}

// ── getPets — 取得 user 所有寵物（多寵物支援）──────
export async function getPets(userId: string): Promise<FocoPet[]> {
  const { data, error } = await supabase
    .from('pets')
    .select('id, owner_id, name, level, xp')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data as any[]).map((row) => ({
    ...row,
    xp_next_level: xpNextLevel(row.level),
  }));
}

// ── getPet — 向下相容 wrapper（取第一隻）───────────
export async function getPet(userId: string): Promise<FocoPet> {
  const pets = await getPets(userId);
  if (!pets.length) throw new Error('No pet found');
  return pets[0];
}

// ── getSessions ───────────────────────────────
export async function getSessions(userId: string): Promise<{
  sessions: SessionRecord[];
  summary: { total_focus_sec: number; streak_days: number; total_sessions: number };
}> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, actual_duration, completed, focus_type_result, xp_earned, ended_at, pause_count, left_app_count')
    .eq('user_id', userId)
    .order('ended_at', { ascending: false });

  if (error) throw error;

  const sessions = data as SessionRecord[];
  const totalFocusSec = sessions.reduce((s, r) => s + r.actual_duration, 0);
  const streakDays = calcStreak(sessions.map((r) => r.ended_at));

  return {
    sessions,
    summary: {
      total_focus_sec: totalFocusSec,
      streak_days: streakDays,
      total_sessions: sessions.length,
    },
  };
}

function calcStreak(endedAtList: string[]): number {
  if (!endedAtList.length) return 0;
  const days = [...new Set(endedAtList.map((d) => d.slice(0, 10)))].sort().reverse();
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff =
      (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86_400_000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// ── getTasks ──────────────────────────────────
export async function getTasks(userId: string): Promise<{ tasks: Task[] }> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, user_id, title, duration_min, status, created_at')
    .eq('user_id', userId)
    .neq('status', 'deleted')        // 軟刪除：status='deleted' 的不顯示
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { tasks: data as Task[] };
}

// ── createTask ────────────────────────────────
export async function createTask(
  userId: string,
  title: string,
  durationMin: number,
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, duration_min: durationMin })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

// ── deleteTask（軟刪除 — status='deleted'）───────
// 注意：等亮節執行 supabase/migrations/add_deleted_to_tasks.sql 之後
// 可改成 update({ deleted: true }) + getTasks 改 .eq('deleted', false)
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'deleted' })
    .eq('id', taskId);
  if (error) throw error;
}
