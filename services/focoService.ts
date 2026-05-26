// ─────────────────────────────────────────────
// FOCO Service — Session / Pet / Task API
// 全部走 Supabase（DB + Edge Function）
// ─────────────────────────────────────────────
import { clearLocalSupabaseSession, getCurrentSession, supabase } from '@/lib/supabase';
import type { SessionPayload, SessionResult, FocoPet, Task, SessionRecord, DayData, SessionSummary, TaskCategory } from '@/types';

// ── 等級門檻（index = level - 1）────────────────
const XP_THRESHOLDS = [0, 100, 250, 500, 900];

function xpNextLevel(level: number): number {
  return level < 5 ? XP_THRESHOLDS[level] : 900;
}

// ── pet-chat（呼叫 Supabase Edge Function → Together AI）────
export async function chatWithPet(petId: string, message: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('pet-chat', {
    body: { petId, message },
  });

  if (error) {
    const ctx = (error as { context?: { status?: number; json?: () => Promise<any> } }).context;
    if (ctx?.status === 429) throw new Error('rate_limited');
    try {
      const body = await ctx?.json?.();
      if (body?.error === 'rate_limited') throw new Error('rate_limited');
      if (body?.detail) console.error('[chat] ai detail:', body.detail);
    } catch (inner) {
      if (inner instanceof Error && inner.message === 'rate_limited') throw inner;
    }
    throw new Error('ai_error');
  }

  const reply = data?.reply as string | undefined;
  if (!reply) throw new Error('empty_reply');
  return reply;
}

// ── session-complete（呼叫 Supabase Edge Function）
export async function completeSession(payload: SessionPayload): Promise<SessionResult> {
  const session = await getCurrentSession();
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
    if (res.status === 401 || res.status === 403) {
      await clearLocalSupabaseSession();
      throw new Error('Not authenticated');
    }
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
    .select('id, task_id, actual_duration, completed, focus_type_result, xp_earned, ended_at, pause_count, left_app_count, quality_score, started_at, tasks(title)')
    .eq('user_id', userId)
    .order('ended_at', { ascending: false });

  if (error) throw error;

  const sessions = data as unknown as SessionRecord[];
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
  const baseSelect = 'id, user_id, title, duration_min, status, category, created_at, icon_type, icon_value, completion_percent';
  let { data, error }: { data: unknown[] | null; error: any } = await supabase
    .from('tasks')
    .select(`${baseSelect}, memo`)
    .eq('user_id', userId)
    .neq('status', 'deleted')        // 軟刪除：status='deleted' 的不顯示
    .order('created_at', { ascending: false });

  if (error) {
    const fallback = await supabase
      .from('tasks')
      .select(baseSelect)
      .eq('user_id', userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return {
    tasks: (data as Task[]).map((t) => ({
      ...t,
      category: t.category ?? 'task',
    })),
  };
}

// ── createTask ────────────────────────────────
export async function createTask(
  userId: string,
  title: string,
  durationMin: number,
  options?: {
    category?: 'task' | 'daily';
    icon_type?: 'emoji' | 'svg';
    icon_value?: string;
    memo?: string;
  },
): Promise<Task> {
  const category = options?.category ?? 'task';
  const row: Record<string, unknown> = {
    user_id: userId,
    title,
    duration_min: durationMin,
    category,
  };
  if (options?.icon_type && options?.icon_value) {
    row.icon_type = options.icon_type;
    row.icon_value = options.icon_value;
  }
  if (options?.memo) {
    row.memo = options.memo;
  }

  let { data, error } = await supabase
    .from('tasks')
    .insert(row)
    .select()
    .single();

  if (error && options?.memo) {
    delete row.memo;
    const fallback = await supabase
      .from('tasks')
      .insert(row)
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return data as Task;
}

// ── updateTask ────────────────────────────────
export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    durationMin?: number;
    category?: TaskCategory;
    icon_type?: 'emoji' | 'svg' | null;
    icon_value?: string | null;
    memo?: string | null;
  },
): Promise<Task> {
  const row: Record<string, unknown> = {};

  if (updates.title !== undefined) row.title = updates.title;
  if (updates.durationMin !== undefined) row.duration_min = updates.durationMin;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.icon_type !== undefined) row.icon_type = updates.icon_type;
  if (updates.icon_value !== undefined) row.icon_value = updates.icon_value;
  if (updates.memo !== undefined) row.memo = updates.memo;

  let { data, error } = await supabase
    .from('tasks')
    .update(row)
    .eq('id', taskId)
    .select()
    .single();

  if (error && Object.prototype.hasOwnProperty.call(row, 'memo')) {
    const fallbackRow = { ...row };
    delete (fallbackRow as { memo?: unknown }).memo;
    const fallback = await supabase
      .from('tasks')
      .update(fallbackRow)
      .eq('id', taskId)
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return data as Task;
}

// ── updateTaskProgress — 更新任務完成進度 ──────────
export async function updateTaskProgress(taskId: string, completionPercent: number): Promise<void> {
  const isDone = completionPercent >= 100;
  const { error } = await supabase
    .from('tasks')
    .update({
      completion_percent: completionPercent,
      ...(isDone ? { status: 'done' } : {}),
    })
    .eq('id', taskId);
  if (error) throw error;
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

// ── getCalendarData — 取得某月每天的 session 數量 ──
export async function getCalendarData(userId: string, year: number, month: number): Promise<DayData[]> {
  const pad = (n: number) => String(n).padStart(2, '0');
  const rangeStart = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const rangeEnd = `${year}-${pad(month)}-${pad(lastDay)}T23:59:59Z`;

  const { data, error } = await supabase
    .from('sessions')
    .select('id, actual_duration, completed, xp_earned, quality_score, started_at, ended_at, tasks(title)')
    .eq('user_id', userId)
    .gte('ended_at', rangeStart)
    .lte('ended_at', rangeEnd)
    .order('ended_at', { ascending: true });

  if (error) throw error;

  const byDate = new Map<string, SessionSummary[]>();
  for (const row of data as any[]) {
    const date = (row.ended_at as string).slice(0, 10);
    const tasksData = row.tasks;
    const task_title = Array.isArray(tasksData)
      ? (tasksData[0]?.title ?? null)
      : (tasksData?.title ?? null);
    const summary: SessionSummary = {
      id: row.id,
      duration_min: Math.round(row.actual_duration / 60),
      task_title,
      quality_score: row.quality_score ?? 0,
      xp_earned: row.xp_earned,
      completed: row.completed,
      started_at: row.started_at ?? row.ended_at,
      ended_at: row.ended_at,
    };
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(summary);
  }

  return Array.from(byDate.entries()).map(([date, sessions]) => ({
    date,
    session_count: sessions.length,
    total_focus_sec: sessions.reduce((acc, s) => acc + s.duration_min * 60, 0),
    sessions,
  }));
}

// ── getWeekSessions — 取得某週（Mon–Sun）的 sessions ──
export async function getWeekSessions(userId: string, weekStart: string): Promise<DayData[]> {
  const monday = new Date(weekStart);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const { data, error } = await supabase
    .from('sessions')
    .select('id, actual_duration, completed, xp_earned, quality_score, started_at, ended_at, tasks(title)')
    .eq('user_id', userId)
    .gte('ended_at', weekStart)
    .lte('ended_at', sunday.toISOString().slice(0, 10) + 'T23:59:59Z')
    .order('ended_at', { ascending: true });

  if (error) throw error;

  // Build all 7 days (Mon→Sun) with empty defaults
  const result: DayData[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { date: d.toISOString().slice(0, 10), session_count: 0, total_focus_sec: 0, sessions: [] };
  });

  for (const row of data as any[]) {
    const date = (row.ended_at as string).slice(0, 10);
    const tasksData = row.tasks;
    const task_title = Array.isArray(tasksData)
      ? (tasksData[0]?.title ?? null)
      : (tasksData?.title ?? null);
    const summary: SessionSummary = {
      id: row.id,
      duration_min: Math.round(row.actual_duration / 60),
      task_title,
      quality_score: row.quality_score ?? 0,
      xp_earned: row.xp_earned,
      completed: row.completed,
      started_at: row.started_at ?? row.ended_at,
      ended_at: row.ended_at,
    };
    const entry = result.find((d) => d.date === date);
    if (entry) {
      entry.sessions.push(summary);
      entry.session_count++;
      entry.total_focus_sec += summary.duration_min * 60;
    }
  }

  return result;
}
