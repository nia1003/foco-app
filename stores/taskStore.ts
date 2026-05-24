import { create } from 'zustand';
import { getTasks } from '@/services/focoService';
import type { Task } from '@/types';

const STALE_MS = 5 * 60 * 1000;

interface TaskStore {
  tasks: Task[];
  tasksLastFetchedAt: number | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  fetchTasks: (userId: string | null, options?: { force?: boolean }) => Promise<void>;
  reset: () => void;
}

function normalizeTask(task: Task): Task {
  const category = task.category ?? 'task';
  return {
    ...task,
    category,
    taskType: task.taskType ?? (category === 'daily' ? 'daily' : 'deadline'),
  };
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  tasksLastFetchedAt: null,

  setTasks: (tasks) =>
    set({
      tasks: tasks.map(normalizeTask),
      tasksLastFetchedAt: Date.now(),
    }),

  addTask: (task) =>
    set((state) => ({
      tasks: [normalizeTask(task), ...state.tasks.filter((t) => t.id !== task.id)],
    })),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    })),

  fetchTasks: async (userId, options) => {
    if (!userId) {
      set({ tasks: [], tasksLastFetchedAt: null });
      return;
    }

    const { tasksLastFetchedAt } = get();
    const isStale = !tasksLastFetchedAt || Date.now() - tasksLastFetchedAt > STALE_MS;
    if (!options?.force && !isStale) return;

    const res = await getTasks(userId);
    set({
      tasks: res.tasks.map(normalizeTask),
      tasksLastFetchedAt: Date.now(),
    });
  },

  reset: () => {
    set({ tasks: [], tasksLastFetchedAt: null });
  },
}));
