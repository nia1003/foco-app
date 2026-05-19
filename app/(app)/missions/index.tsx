/**
 * MissionsScreen — Quest list + My Tasks
 * Task / Daily tabs · ▶ starts focus directly
 */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createMissionsStyles } from '@/styles/missionsScreen.styles';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useSound } from '@/components/SoundProvider';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useFocusLaunch } from '@/hooks/useFocusLaunch';
import type { FocusQuickSetupValue } from '@/components/home/FocusQuickSetup';
import { getTasks, deleteTask } from '@/services/focoService';
import { mockPets, mockTasks } from '@/data/mockData';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { TaskIcon } from '@/components/tasks/TaskIcon';
import { resolveTaskIcon } from '@/lib/taskIcon';
import type { Task, TaskCategory } from '@/types';


type TabType = 'task' | 'daily';

type Quest = {
  id: string;
  title: string;
  sub: string;
  progress: number;
  reward: string;
  emoji: string;
  duration_min: number;
  category: TaskCategory;
};

type QuestsState = Record<TabType, Quest[]>;

const INITIAL_QUESTS: QuestsState = {
  task: [
    { id: 'q1', title: 'Morning Focus Sprint', sub: 'Complete 3 sessions before noon', progress: 0.66, reward: '+30 XP', emoji: '🌅', duration_min: 25, category: 'task' },
    { id: 'q2', title: 'Book Worm', sub: 'Read for 2 hours total', progress: 0.45, reward: '+25 XP', emoji: '📚', duration_min: 50, category: 'task' },
    { id: 'q3', title: 'Inbox Zero', sub: 'Clear your email queue', progress: 0.20, reward: '+15 XP', emoji: '📬', duration_min: 15, category: 'task' },
    { id: 'q6', title: 'First Week!', sub: 'Complete 7 days in a row', progress: 0.43, reward: '🏆 Trophy', emoji: '⭐', duration_min: 25, category: 'task' },
  ],
  daily: [
    { id: 'q4', title: 'Daily Checkin', sub: 'Log at least 1 session today', progress: 0.0, reward: '+5 XP', emoji: '✅', duration_min: 15, category: 'daily' },
    { id: 'q5', title: 'Flow State', sub: 'Complete a 50-min session', progress: 0.0, reward: '+20 XP', emoji: '🌊', duration_min: 50, category: 'daily' },
  ],
};

export default function MissionsScreen() {
  const [tab, setTab] = useState<TabType>('task');
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet } = usePetStore();
  const { play } = useSound();
  const { screenBg, colors } = useAppTheme();
  const styles = useThemedStyles(createMissionsStyles);
  const { launchFocus } = useFocusLaunch();
  const focusDurationMin = usePreferencesStore((s) => s.focusDurationMin);
  const avatarUri = usePreferencesStore((s) => s.avatarUri);

  const [tasks, setTasks] = useState<Task[]>(mockTasks.tasks);
  const [questsState, setQuestsState] = useState<QuestsState>(INITIAL_QUESTS);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const displayName = userName ?? userEmail?.split('@')[0] ?? '?';
  const settingsAvatar = displayName[0]?.toUpperCase() ?? '?';
  const modalPets = pets.length > 0 ? pets : mockPets.slice(0, 1);

  useEffect(() => {
    if (!userId) return;
    getTasks(userId)
      .then((res) =>
        setTasks(
          res.tasks.map((t) => ({ ...t, category: t.category ?? 'task' })),
        ),
      )
      .catch(() => {});
  }, [userId]);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const tabTasks = pendingTasks.filter((t) => (t.category ?? 'task') === tab);
  const currentQuests = questsState[tab];

  const buildSetup = (
    partial: Partial<FocusQuickSetupValue>,
  ): FocusQuickSetupValue => ({
    taskMode: 'none',
    selectedTaskId: null,
    newIconType: 'emoji',
    newIcon: '📚',
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
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            deleteTask(taskId).catch(() => {
              Alert.alert('Delete failed', 'Network error. Please try again.');
            });
          },
        },
      ],
    );
  };

  const handleDeleteQuest = (questId: string, questTitle: string) => {
    Alert.alert('Remove quest', `Remove "${questTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setQuestsState((prev) => ({
            ...prev,
            [tab]: prev[tab].filter((q) => q.id !== questId),
          }));
        },
      },
    ]);
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
            <Text style={styles.addBtnText}>+ Task</Text>
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
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'task' ? 'Task' : 'Daily'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.list}>
          {currentQuests.length === 0 && (
            <FrostCard radius={20} padded={false}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No quests in this category.</Text>
              </View>
            </FrostCard>
          )}

          {currentQuests.map((q) => (
            <View key={q.id} style={styles.myTaskWrap}>
              <FrostCard radius={20} padded={false}>
                <View style={styles.myTaskCard}>
                  <View style={styles.taskEmojiWrap}>
                    <Text style={styles.taskEmoji}>{q.emoji}</Text>
                  </View>
                  <View style={styles.myTaskInfo}>
                    <Text style={styles.myTaskTitle}>{q.title}</Text>
                    <Text style={styles.myTaskSub}>{q.sub}</Text>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${q.progress * 100}%` as `${number}%` }]} />
                    </View>
                    <Text style={styles.questReward}>{q.duration_min} min</Text>
                  </View>
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.myTaskStartBtn}
                      onPress={() =>
                        startFocus(
                          { taskMode: 'none' },
                          { fallbackTitle: `${q.emoji} ${q.title}` },
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.myTaskStartIcon}>▶</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => {
                        play('tap');
                        handleDeleteQuest(q.id, q.title);
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

        <View style={styles.myTasksSection}>
          <Text style={styles.myTasksLabel}>MY TASKS</Text>

          {tabTasks.length === 0 && (
            <FrostCard radius={20} padded={false}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tasks in this category.</Text>
              </View>
            </FrostCard>
          )}

          <View style={styles.taskList}>
            {tabTasks.map((task) => (
              <View key={task.id} style={styles.myTaskWrap}>
                <FrostCard radius={20} padded={false}>
                  <View style={styles.myTaskCard}>
                    <View style={styles.taskEmojiWrap}>
                      <TaskIcon icon={resolveTaskIcon(task)} size={20} />
                    </View>
                    <View style={styles.myTaskInfo}>
                      <Text style={styles.myTaskTitle}>{task.title}</Text>
                      <Text style={styles.myTaskSub}>{task.duration_min} min</Text>
                      {task.memo ? (
                        <Text style={styles.myTaskMemo} numberOfLines={1}>{task.memo}</Text>
                      ) : null}
                    </View>
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
                        <Text style={styles.myTaskStartIcon}>▶</Text>
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
          setTasks((prev) => [{ ...task, category: tab }, ...prev])
        }
      />
    </View>
  );
}

