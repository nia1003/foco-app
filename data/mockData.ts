// ─────────────────────────────────────────────
// Mock Data — 後端未完成時前端直接 import 使用
// 後端好了：把 import 來源換成 focoService 即可
// ─────────────────────────────────────────────
import type {
  SessionResult,
  FocoPet,
  SessionRecord,
  Task,
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
  name: 'Xingwang',
  level: 2,
  xp: 180,
  xp_next_level: 250,
};

// Multi-pet mock — all 4 pets, mirrors what DB creates at signup
export const mockPets: FocoPet[] = [
  {
    id: 'mock-pet-001',
    owner_id: 'mock-user-001',
    name: 'Xingwang',
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

export const mockTasks: { tasks: Task[] } = {
  tasks: [
    {
      id: 't001',
      user_id: 'mock-user-001',
      title: 'focus for data structure exam',
      duration_min: 50,
      status: 'pending',
      created_at: '2025-05-15T00:00:00Z',
    },
  ],
};
