// ─────────────────────────────────────────────
// Mock Data — 後端未完成時前端直接 import 使用
// 後端好了：把 import 來源換成 focoService 即可
// ─────────────────────────────────────────────
import type {
  SessionResult,
  FocoPet,
  SessionRecord,
  Task,
  DayData,
} from '@/types';

export const mockSessionResult: SessionResult = {
  session_id: 'mock-001',
  pet_id: 'mock-pet-001',
  xp_gained: 50,
  new_xp: 180,
  new_level: 2,
  level_up: true,
  focus_type: 'conscientiousness',
  xp_next_level: 250,
  quality_score: 85,
};

// Single-pet alias for components that still use mockPet directly
export const mockPet: FocoPet = {
  id: 'mock-pet-001',
  owner_id: 'mock-user-001',
  name: 'Sunion',
  level: 2,
  xp: 180,
  xp_next_level: 250,
};

// Multi-pet mock — all 4 pets, mirrors what DB creates at signup
export const mockPets: FocoPet[] = [
  {
    id: 'mock-pet-001',
    owner_id: 'mock-user-001',
    name: 'Sunion',
    level: 2,
    xp: 180,
    xp_next_level: 250,
  },
  {
    id: 'mock-pet-002',
    owner_id: 'mock-user-001',
    name: 'Lily',
    level: 1,
    xp: 40,
    xp_next_level: 100,
  },
  {
    id: 'mock-pet-003',
    owner_id: 'mock-user-001',
    name: 'Fluff',
    level: 1,
    xp: 20,
    xp_next_level: 100,
  },
  {
    id: 'mock-pet-004',
    owner_id: 'mock-user-001',
    name: 'Stay',
    level: 1,
    xp: 0,
    xp_next_level: 100,
  },
];

export const mockSessions: {
  sessions: SessionRecord[];
  summary: { total_focus_sec: number; streak_days: number; total_sessions: number };
} = {
  sessions: [
    {
      id: 's001',
      actual_duration: 1423,
      completed: true,
      focus_type_result: 'dominance',
      xp_earned: 30,
      ended_at: '2025-05-15T10:30:00Z',
    },
    {
      id: 's002',
      actual_duration: 890,
      completed: false,
      focus_type_result: 'influence',
      xp_earned: 5,
      ended_at: '2025-05-14T09:00:00Z',
    },
    {
      id: 's003',
      actual_duration: 3012,
      completed: true,
      focus_type_result: 'conscientiousness',
      xp_earned: 50,
      ended_at: '2025-05-13T14:00:00Z',
    },
  ],
  summary: {
    total_focus_sec: 12400,
    streak_days: 3,
    total_sessions: 8,
  },
};

export const mockCalendarData: DayData[] = [
  {
    date: '2026-05-02',
    session_count: 1,
    sessions: [{ id: 'mc1', duration_min: 25, task_title: 'Morning review', quality_score: 78, xp_earned: 22, completed: true, started_at: '2026-05-02T09:00:00Z', ended_at: '2026-05-02T09:25:00Z' }],
  },
  {
    date: '2026-05-05',
    session_count: 2,
    sessions: [
      { id: 'mc2', duration_min: 45, task_title: 'Data structure', quality_score: 88, xp_earned: 35, completed: true, started_at: '2026-05-05T10:00:00Z', ended_at: '2026-05-05T10:45:00Z' },
      { id: 'mc3', duration_min: 25, task_title: null, quality_score: 65, xp_earned: 15, completed: true, started_at: '2026-05-05T15:00:00Z', ended_at: '2026-05-05T15:25:00Z' },
    ],
  },
  {
    date: '2026-05-07',
    session_count: 1,
    sessions: [{ id: 'mc4', duration_min: 50, task_title: 'Algorithm study', quality_score: 92, xp_earned: 45, completed: true, started_at: '2026-05-07T09:00:00Z', ended_at: '2026-05-07T09:50:00Z' }],
  },
  {
    date: '2026-05-10',
    session_count: 3,
    sessions: [
      { id: 'mc5', duration_min: 25, task_title: 'Reading', quality_score: 80, xp_earned: 25, completed: true, started_at: '2026-05-10T08:00:00Z', ended_at: '2026-05-10T08:25:00Z' },
      { id: 'mc6', duration_min: 25, task_title: 'Reading', quality_score: 75, xp_earned: 20, completed: true, started_at: '2026-05-10T14:00:00Z', ended_at: '2026-05-10T14:25:00Z' },
      { id: 'mc7', duration_min: 50, task_title: 'Exam prep', quality_score: 88, xp_earned: 38, completed: true, started_at: '2026-05-10T19:00:00Z', ended_at: '2026-05-10T19:50:00Z' },
    ],
  },
  {
    date: '2026-05-12',
    session_count: 1,
    sessions: [{ id: 'mc8', duration_min: 45, task_title: 'Project work', quality_score: 70, xp_earned: 25, completed: true, started_at: '2026-05-12T11:00:00Z', ended_at: '2026-05-12T11:45:00Z' }],
  },
  {
    date: '2026-05-14',
    session_count: 2,
    sessions: [
      { id: 'mc9', duration_min: 25, task_title: 'Coding practice', quality_score: 85, xp_earned: 30, completed: true, started_at: '2026-05-14T09:30:00Z', ended_at: '2026-05-14T09:55:00Z' },
      { id: 'mc10', duration_min: 50, task_title: 'System design', quality_score: 90, xp_earned: 42, completed: true, started_at: '2026-05-14T14:00:00Z', ended_at: '2026-05-14T14:50:00Z' },
    ],
  },
  {
    date: '2026-05-17',
    session_count: 2,
    sessions: [
      { id: 'mc11', duration_min: 45, task_title: 'focus for data structure exam', quality_score: 85, xp_earned: 32, completed: true, started_at: '2026-05-17T09:00:00Z', ended_at: '2026-05-17T09:45:00Z' },
      { id: 'mc12', duration_min: 25, task_title: null, quality_score: 72, xp_earned: 18, completed: true, started_at: '2026-05-17T15:00:00Z', ended_at: '2026-05-17T15:25:00Z' },
    ],
  },
];

export function getMockCalendarData(year: number, month: number): DayData[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  return mockCalendarData.filter((d) => d.date.startsWith(prefix));
}

export const mockTasks: { tasks: Task[] } = {
  tasks: [
    {
      id: 't001',
      user_id: 'mock-user-001',
      title: 'SAD hw1',
      duration_min: 50,
      status: 'pending',
      created_at: '2025-05-15T00:00:00Z',
      taskType: 'deadline',
    },
    {
      id: 't002',
      user_id: 'mock-user-001',
      title: '資管專題進度',
      duration_min: 60,
      status: 'pending',
      created_at: '2025-05-16T00:00:00Z',
      taskType: 'deadline',
    },
    {
      id: 't003',
      user_id: 'mock-user-001',
      title: 'SAD hw1',
      duration_min: 25,
      status: 'pending',
      created_at: '2025-05-17T00:00:00Z',
      taskType: 'daily',
    },
    {
      id: 't004',
      user_id: 'mock-user-001',
      title: '資管專題進度',
      duration_min: 25,
      status: 'pending',
      created_at: '2025-05-17T01:00:00Z',
      taskType: 'daily',
    },
    {
      id: 't005',
      user_id: 'mock-user-001',
      title: 'FOCO APP',
      duration_min: 30,
      status: 'pending',
      created_at: '2025-05-17T02:00:00Z',
      taskType: 'daily',
    },
  ],
};
