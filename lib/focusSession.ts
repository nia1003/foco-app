import type { Router } from 'expo-router';
import type { FocoPet, Task } from '@/types';
import { focusTitleWithIcon, resolveTaskIcon } from '@/lib/taskIcon';

export type FocusLaunchConfig = {
  durationMin: number;
  petId: string;
  taskId?: string | null;
  taskTitle?: string;
};

export function isMockPetId(petId?: string | null): boolean {
  return !petId || petId === 'unknown' || petId.startsWith('mock-');
}

export function resolveLaunchPetId(params: {
  requestedPetId?: string | null;
  pets: FocoPet[];
  activePet?: FocoPet | null;
}): string | null {
  const realPets = params.pets.filter((pet) => !isMockPetId(pet.id));
  const requested = realPets.find((pet) => pet.id === params.requestedPetId);
  if (requested) return requested.id;

  if (params.activePet && !isMockPetId(params.activePet.id)) {
    const active = realPets.find((pet) => pet.id === params.activePet?.id);
    if (active) return active.id;
  }

  return realPets[0]?.id ?? null;
}

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
