import type { Task, TaskIconType } from '@/types';

export interface TaskIconValue {
  type: TaskIconType;
  value: string;
}

export const DEFAULT_TASK_ICON: TaskIconValue = { type: 'emoji', value: '📌' };

export function resolveTaskIcon(
  task: Pick<Task, 'icon_type' | 'icon_value' | 'emoji'>,
): TaskIconValue {
  if (task.icon_type && task.icon_value) {
    return { type: task.icon_type, value: task.icon_value };
  }
  if (task.emoji) {
    return { type: 'emoji', value: task.emoji };
  }
  return DEFAULT_TASK_ICON;
}

/** Focus timer header — emoji prefix only; SVG uses title alone */
export function focusTitleWithIcon(title: string, icon: TaskIconValue): string {
  const trimmed = title.trim();
  if (icon.type === 'emoji') return `${icon.value} ${trimmed}`;
  return trimmed;
}
