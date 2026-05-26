import { useCallback } from 'react';

import { Alert } from 'react-native';

import { useRouter } from 'expo-router';

import { useSound } from '@/components/SoundProvider';

import { navigateToFocus, resolveLaunchPetId, resolveTaskTitle } from '@/lib/focusSession';

import { focusTitleWithIcon } from '@/lib/taskIcon';

import { createTask } from '@/services/focoService';

import { useAuthStore } from '@/stores/authStore';

import { usePetStore } from '@/stores/petStore';

import { usePreferencesStore } from '@/stores/preferencesStore';

import type { FocusQuickSetupValue } from '@/components/home/FocusQuickSetup';

import type { Task } from '@/types';

export function useFocusLaunch() {
  const router = useRouter();

  const { play } = useSound();

  const { userId } = useAuthStore();

  const { activePet, pets, setActivePet } = usePetStore();

  const setFocusDurationMin = usePreferencesStore((s) => s.setFocusDurationMin);

  const launchFocus = useCallback(
    async (
      setup: FocusQuickSetupValue,

      tasks: Task[],

      options?: { fallbackTitle?: string },
    ) => {
      if (setup.taskMode === 'new' && !setup.newTitle.trim()) {
        Alert.alert(
          'Title required',
          'Enter a task name, or choose Free focus / an existing task.',
        );

        return;
      }

      const launchPetId = resolveLaunchPetId({
        requestedPetId: setup.selectedPetId,
        pets,
        activePet,
      });

      if (!launchPetId) {
        Alert.alert(
          'Companion still loading',
          'Please wait a moment for your pets to sync, then start focus again.',
        );

        return;
      }

      play('transition_up');

      await setFocusDurationMin(setup.durationMin);

      if (launchPetId !== activePet?.id) {
        await setActivePet(launchPetId);
      }

      const newIcon = { type: setup.newIconType, value: setup.newIcon };

      let taskId: string | null = setup.selectedTaskId;

      let taskTitle =
        options?.fallbackTitle ??
        resolveTaskTitle(
          setup.taskMode,

          tasks,

          setup.selectedTaskId,

          newIcon,

          setup.newTitle,
        );

      if (setup.taskMode === 'new' && setup.newTitle.trim()) {
        try {
          const created = await createTask(
            userId ?? '',
            setup.newTitle.trim(),
            setup.durationMin,
            {
              icon_type: setup.newIconType,

              icon_value: setup.newIcon,
            },
          );

          taskId = created.id;

          taskTitle = focusTitleWithIcon(setup.newTitle.trim(), newIcon);
        } catch {
          Alert.alert('Could not create task', 'Please try again in a moment.');

          return;
        }
      }

      navigateToFocus(router, {
        durationMin: setup.durationMin,

        petId: launchPetId,

        taskId,

        taskTitle,
      });
    },

    [activePet, pets, play, router, setActivePet, setFocusDurationMin, userId],
  );

  return { launchFocus };
}
