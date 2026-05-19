import type { Router } from 'expo-router';
import type { Task } from '@/types';
import { focusTitleWithIcon, resolveTaskIcon } from '@/lib/taskIcon';

export type FocusLaunchConfig = {
  durationMin: number;
  petId: string;
  taskId?: string | null;
  taskTitle?: string;
};

export function buildFocusParams(config: FocusLaunchConfig): Record<string, string> {
  return {
    durationMin: String(config.durationMin),
    petId: config.petId,
    ...(config.taskId ? { taskId: config.taskId } : {}),
    ...(config.taskTitle ? { taskTitle: config.taskTitle } : {}),
  };
}

export function navigateToFocus(router: Router, config: FocusLaunchConfig) {
  router.push({
    pathname: '/(app)/focus',
    params: buildFocusParams(config),
  });
}

export function resolveTaskTitle(
  taskMode: 'none' | 'existing' | 'new',
  tasks: Task[],
  selectedTaskId: string | null,
  newIcon: { type: 'emoji' | 'svg'; value: string },
  newTitle: string,
  initialTaskTitle?: string | null,
): string | undefined {
  if (taskMode === 'new' && newTitle.trim()) {
    return focusTitleWithIcon(newTitle.trim(), newIcon);
  }
  if (taskMode === 'existing' && selectedTaskId) {
    const t = tasks.find((x) => x.id === selectedTaskId);
    if (t) return focusTitleWithIcon(t.title, resolveTaskIcon(t));
  }
  if (initialTaskTitle) return initialTaskTitle;
  return undefined;
}
