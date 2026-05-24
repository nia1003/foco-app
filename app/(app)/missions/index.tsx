import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createMissionsStyles } from '@/styles/missionsScreen.styles';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTaskStore } from '@/stores/taskStore';
import { useSound } from '@/components/SoundProvider';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFocusLaunch } from '@/hooks/useFocusLaunch';
import type { FocusQuickSetupValue } from '@/components/home/FocusQuickSetup';
import { deleteTask } from '@/services/focoService';
import { mockPets } from '@/data/mockData';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { TaskIcon } from '@/components/tasks/TaskIcon';
import { resolveTaskIcon } from '@/lib/taskIcon';
import type { Task } from '@/types';

type TabType = 'task' | 'daily';

export default function MissionsScreen() {
  const [tab, setTab] = useState<TabType>('task');
  const router = useRouter();
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet } = usePetStore();
  const { play } = useSound();
  const { screenBg, colors } = useAppTheme();
  const styles = useThemedStyles(createMissionsStyles);
  const { launchFocus } = useFocusLaunch();
  const focusDurationMin = usePreferencesStore((s) => s.focusDurationMin);
  const avatarUri = usePreferencesStore((s) => s.avatarUri);

  const { tasks, addTask, removeTask, fetchTasks } = useTaskStore();
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const displayName = userName ?? userEmail?.split('@')[0] ?? '?';
  const settingsAvatar = displayName[0]?.toUpperCase() ?? '?';
  const modalPets = pets.length > 0 ? pets : mockPets.slice(0, 1);

  useEffect(() => {
    fetchTasks(userId).catch(() => {});
  }, [userId, fetchTasks]);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const tabTasks = pendingTasks.filter((t) => (t.category ?? 'task') === tab);

  const buildSetup = (
    partial: Partial<FocusQuickSetupValue>,
  ): FocusQuickSetupValue => ({
    taskMode: 'none',
    selectedTaskId: null,
    newIconType: 'emoji',
    newIcon: '??',
    newTitle: '',
    newMemo: '',
    selectedPetId: activePet?.id ?? modalPets[0]?.id ?? null,
    durationMin: focusDurationMin,
    ...partial,
  });

  const startFocus = async (
    partial: Partial<FocusQuickSetupValue>,
    opts?: { fallbackTitle?: string },
  ) => {
    play('tap');
    const setup = buildSetup(partial);
    await launchFocus(setup, pendingTasks, opts);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete task',
      `Delete "${taskTitle}"?\nCompleted focus sessions will stay in your history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeTask(taskId);
            deleteTask(taskId).catch(() => {
              Alert.alert('Delete failed', 'Network error. Please try again.');
            });
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />
      <FocoBar avatar={settingsAvatar} avatarUri={avatarUri} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Missions</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              play('tap');
              setAddTaskOpen(true);
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.addBtnText}>
              {tab === 'task' ? '+ Deadline' : '+ Daily'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {(['task', 'daily'] as TabType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, tab === t && styles.tabPillActive]}
              onPress={() => {
                play('tap');
                setTab(t);
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[styles.tabLabel, tab === t && styles.tabLabelActive]}
              >
                {t === 'task' ? 'Deadline' : 'Daily'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.myTasksSection}>
          <Text style={styles.myTasksLabel}>MY TASKS</Text>

          {tabTasks.length === 0 && (
            <FrostCard radius={20} padded={false}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No {tab === 'task' ? 'deadline' : 'daily'} tasks yet.
                </Text>
              </View>
            </FrostCard>
          )}

          <View style={styles.taskList}>
            {tabTasks.map((task: Task) => (
              <View key={task.id} style={styles.myTaskWrap}>
                <FrostCard radius={20} padded={false}>
                  <View style={styles.myTaskCard}>
                    <TouchableOpacity
                      style={styles.taskInfoPressable}
                      onPress={() => router.push({ pathname: '/(app)/missions/[id]', params: { id: task.id } })}
                      activeOpacity={0.78}
                    >
                      <View style={styles.taskEmojiWrap}>
                        <TaskIcon icon={resolveTaskIcon(task)} size={20} />
                      </View>
                      <View style={styles.myTaskInfo}>
                        <Text style={styles.myTaskTitle}>{task.title}</Text>
                        <Text style={styles.myTaskSub}>
                          {task.duration_min} min
                        </Text>
                        {task.memo ? (
                          <Text style={styles.myTaskMemo} numberOfLines={1}>
                            {task.memo}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.taskActions}>
                      <TouchableOpacity
                        style={styles.myTaskStartBtn}
                        onPress={() =>
                          startFocus({
                            taskMode: 'existing',
                            selectedTaskId: task.id,
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.myTaskStartIcon}>→</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          play('tap');
                          handleDeleteTask(task.id, task.title);
                        }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={colors.inkFaint} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </FrostCard>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <AddTaskModal
        visible={addTaskOpen}
        category={tab}
        defaultDurationMin={focusDurationMin}
        userId={userId}
        onClose={() => setAddTaskOpen(false)}
        onCreated={(task) =>
          addTask({ ...task, category: tab })
        }
      />
    </View>
  );
}
