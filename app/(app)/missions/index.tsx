import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { AppBackground } from '@/components/ui/AppBackground';
import { FocoBar } from '@/components/layout/FocoBar';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTaskStore } from '@/stores/taskStore';
import { useSound } from '@/components/SoundProvider';
import { useFocusLaunch } from '@/hooks/useFocusLaunch';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { FocusQuickSetupValue } from '@/components/home/FocusQuickSetup';
import { deleteTask } from '@/services/focoService';
import { mockPets } from '@/data/mockData';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { TaskIcon } from '@/components/tasks/TaskIcon';
import { TaskDetailModal } from '../../../components/tasks/TaskDetailModal';
import { resolveTaskIcon } from '@/lib/taskIcon';
import {
  createMissionGridStyles,
  type MissionGridStyles,
} from '@/styles/missionsScreen.styles';
import type { Task } from '@/types';

type TabType = 'task' | 'daily';

function formatDeadline(deadlineAt: string | null | undefined): { label: string; overdue: boolean } | null {
  if (!deadlineAt) return null;
  const diffDays = Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return { label: 'overdue', overdue: true };
  if (diffDays === 0) return { label: 'due today', overdue: false };
  if (diffDays === 1) return { label: '1 day left', overdue: false };
  return { label: `${diffDays} days left`, overdue: false };
}

function MissionTaskCard({
  task,
  styles: s,
  onOpen,
  onStart,
  onDelete,
}: {
  task: Task;
  styles: MissionGridStyles;
  onOpen: () => void;
  onStart: () => void;
  onDelete: () => void;
}) {
  const { colors } = useAppTheme();
  const deadline = formatDeadline(task.deadline_at);

  return (
    <View style={s.taskCard}>
      <TouchableOpacity style={s.taskOpenArea} onPress={onOpen} activeOpacity={0.78}>
        <View style={s.taskTextBlock}>
          <Text style={s.taskTitle} numberOfLines={2}>{task.title}</Text>
          {deadline ? (
            <Text style={[s.deadlineBadge, deadline.overdue && s.deadlineOverdue]} numberOfLines={1}>
              {deadline.label}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.deleteBtn}
        onPress={onDelete}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Trash2 size={16} color="rgba(26,22,34,0.40)" />
      </TouchableOpacity>

      <View style={s.taskIconWrap}>
        <TaskIcon icon={resolveTaskIcon(task)} size={22} />
      </View>

      <TouchableOpacity
        style={s.startBtn}
        onPress={onStart}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={s.startIcon}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MissionsScreen() {
  const s = useThemedStyles(createMissionGridStyles);
  const [tab, setTab]                 = useState<TabType>('task');
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet }             = usePetStore();
  const { play }                        = useSound();
  const { launchFocus }                 = useFocusLaunch();
  const focusDurationMin                = usePreferencesStore((s) => s.focusDurationMin);
  const avatarUri                       = usePreferencesStore((s) => s.avatarUri);
  const { tasks, addTask, removeTask, fetchTasks } = useTaskStore();

  const displayName    = userName ?? userEmail?.split('@')[0] ?? '?';
  const settingsAvatar = displayName[0]?.toUpperCase() ?? '?';
  const modalPets      = pets.length > 0 ? pets : mockPets.slice(0, 1);

  useEffect(() => { fetchTasks(userId).catch(() => {}); }, [userId, fetchTasks]);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const tabTasks     = pendingTasks.filter((t) => (t.category ?? 'task') === tab);

  const buildSetup = (partial: Partial<FocusQuickSetupValue>): FocusQuickSetupValue => ({
    taskMode: 'none',
    selectedTaskId: null,
    newIconType: 'emoji',
    newIcon: '📌',
    newTitle: '',
    newMemo: '',
    selectedPetId: activePet?.id ?? modalPets[0]?.id ?? null,
    durationMin: focusDurationMin,
    ...partial,
  });

  const startFocus = async (partial: Partial<FocusQuickSetupValue>) => {
    play('tap');
    await launchFocus(buildSetup(partial), pendingTasks);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete task',
      `Delete "${taskTitle}"?\nFocus sessions will stay in your history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            removeTask(taskId);
            deleteTask(taskId).catch(() =>
              Alert.alert('Delete failed', 'Network error. Please try again.'),
            );
          },
        },
      ],
    );
  };

  return (
    <View style={s.root}>
      <AppBackground />
      <FocoBar avatar={settingsAvatar} avatarUri={avatarUri} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.titleRow}>
          <Text style={s.title}>Tasks</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => { play('tap'); setAddTaskOpen(true); }}
            activeOpacity={0.8}
          >
            <Text style={s.addBtnText}>+ Task</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {(['task', 'daily'] as TabType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.tabPill, tab === t && s.tabPillActive]}
              onPress={() => { play('tap'); setTab(t); }}
              activeOpacity={0.75}
            >
              <Text style={[s.tabLabel, tab === t && s.tabLabelActive]}>
                {t === 'task' ? 'Deadline' : 'Daily'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Task list */}
        <Text style={s.sectionLabel}>my tasks</Text>

        {tabTasks.length === 0 && (
          <View style={[s.taskCard, s.emptyCard]}>
            <Text style={s.emptyText}>
              No {tab === 'task' ? 'deadline' : 'daily'} tasks yet.
            </Text>
          </View>
        )}

        {tabTasks.length > 0 && (
          <View style={s.taskGrid}>
            {tabTasks.map((task: Task) => (
              <MissionTaskCard
                key={task.id}
                styles={s}
                task={task}
                onOpen={() => { play('tap'); setSelectedTaskId(task.id); }}
                onStart={() => startFocus({ taskMode: 'existing', selectedTaskId: task.id })}
                onDelete={() => { play('tap'); handleDeleteTask(task.id, task.title); }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AddTaskModal
        visible={addTaskOpen}
        defaultDurationMin={focusDurationMin}
        userId={userId}
        onClose={() => setAddTaskOpen(false)}
        onCreated={(task) => { addTask(task); }}
      />

      <TaskDetailModal
        visible={selectedTaskId !== null}
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </View>
  );
}
