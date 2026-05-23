import type { SessionRecord, Task } from '@/types';

export interface ReceiptLogItem {
  title: string;
  /** Right-aligned value: focus duration or completion time. */
  right: string;
}

export interface ReceiptData {
  name: string;
  mood: string;
  role: string;
  dayName: string;
  dateStr: string;
  timeStr: string;
  receiptNo: string;
  logItems: ReceiptLogItem[];
  itemsCompleted: number;
  interruptions: number;
  totalActiveTime: string;
  authCode: string;
  barcodeValue: string;
  barcodeSeed: string;
}

const DAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatClock(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatReceiptDate(d: Date): string {
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
}

function formatBarcodeDateTime(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}.${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

export function formatDurationSec(totalSec: number): string {
  const totalMin = Math.floor(totalSec / 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0 && m > 0) return `${h}H ${m}M`;
  if (h > 0) return `${h}H`;
  if (m > 0) return `${m}M`;
  if (totalMin > 0) return `${totalMin}M`;
  return '<1M';
}

function isSameDay(iso: string, day: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

function sessionTitle(s: SessionRecord): string {
  const tasksData = s.tasks;
  if (Array.isArray(tasksData)) return tasksData[0]?.title ?? 'Focus session';
  if (tasksData && typeof tasksData === 'object' && 'title' in tasksData) {
    return (tasksData as { title: string }).title;
  }
  return 'Focus session';
}

function taskDisplayTitle(task: Task): string {
  return task.emoji ? `${task.emoji} ${task.title}` : task.title;
}

function buildTodayLogItems(
  todaySessions: SessionRecord[],
  tasks: Task[],
  now: Date,
): ReceiptLogItem[] {
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const usedTaskIds = new Set<string>();

  const fromSessions = todaySessions
    .filter((s) => s.completed && isSameDay(s.ended_at ?? s.started_at ?? '', now))
    .sort(
      (a, b) =>
        new Date(a.ended_at).getTime() - new Date(b.ended_at).getTime(),
    )
    .map((s) => {
      const endedAt = new Date(s.ended_at);
      const linked = s.task_id ? taskById.get(s.task_id) : undefined;
      if (s.task_id) usedTaskIds.add(s.task_id);

      const title = linked ? taskDisplayTitle(linked) : sessionTitle(s);
      const timeStr = formatClock(endedAt);
      const durationStr = formatDurationSec(s.actual_duration);

      return {
        title,
        right: `${timeStr} · ${durationStr}`,
      };
    });

  const fromDoneTasks = tasks
    .filter(
      (t) =>
        t.status === 'done' &&
        isSameDay(t.created_at, now) &&
        !usedTaskIds.has(t.id),
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((task) => {
      const created = new Date(task.created_at);
      return {
        title: taskDisplayTitle(task),
        right: `${formatClock(created)} · ${task.duration_min}M`,
      };
    });

  return [...fromSessions, ...fromDoneTasks];
}

export function buildReceiptData(
  sessions: SessionRecord[],
  tasks: Task[],
  opts: {
    userName: string | null;
    userEmail: string | null;
    petLevel?: number;
    now?: Date;
  },
): ReceiptData {
  const now = opts.now ?? new Date();

  const todaySessions = sessions.filter((s) =>
    isSameDay(s.ended_at ?? s.started_at ?? '', now),
  );

  const logItems = buildTodayLogItems(todaySessions, tasks, now);

  const completedToday = todaySessions.filter(
    (s) => s.completed && isSameDay(s.ended_at ?? s.started_at ?? '', now),
  );
  const totalSec = completedToday.reduce((acc, s) => acc + s.actual_duration, 0);
  const interruptions = completedToday.reduce(
    (acc, s) => acc + (s.left_app_count ?? 0),
    0,
  );

  const displayName =
    opts.userName?.trim() ||
    opts.userEmail?.split('@')[0]?.toUpperCase() ||
    'FOCO USER';

  const sessionCount = Math.max(completedToday.length, 1);
  const receiptIndex = String(sessionCount).padStart(4, '0');
  const dateStr = formatReceiptDate(now);
  const level = opts.petLevel ?? 1;

  return {
    name: displayName.toUpperCase(),
    mood: `LV.${level}`,
    role: 'FOCUSED',
    dayName: DAY_NAMES[now.getDay()],
    dateStr,
    timeStr: formatClock(now),
    receiptNo: `#${receiptIndex}`,
    logItems,
    itemsCompleted: logItems.length,
    interruptions,
    totalActiveTime: formatDurationSec(totalSec),
    authCode: String(100000 + (now.getTime() % 900000)),
    barcodeValue: formatBarcodeDateTime(now),
    barcodeSeed: `${dateStr}-${receiptIndex}`,
  };
}
