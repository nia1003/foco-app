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
import { FocoBar } from '@/components/layout/FocoBar';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTaskStore } from '@/stores/taskStore';
import { useSound } from '@/components/SoundProvider';
import { useFocusLaunch } from '@/hooks/useFocusLaunch';
import type { FocusQuickSetupValue } from '@/components/home/FocusQuickSetup';
import { deleteTask } from '@/services/focoService';
import { mockPets } from '@/data/mockData';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { TaskDetailModal } from '../../../components/tasks/TaskDetailModal';
import type { Task } from '@/types';

const BG   = '#EFE8E0';
const INK  = '#1a1622';
const CARD = '#E6E6E6';
const BTN_SIZE = 36;

type TabType = 'task' | 'daily';

export default function MissionsScreen() {
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

        {tabTasks.map((task: Task) => (
          <View key={task.id} style={s.taskCard}>
            <TouchableOpacity
              style={s.taskInfoPressable}
              onPress={() => { play('tap'); setSelectedTaskId(task.id); }}
              activeOpacity={0.78}
            >
              <View style={s.taskIconWrap}>
                <Text style={s.taskIconText}>📌</Text>
              </View>
              <View style={s.taskInfo}>
                <Text style={s.taskTitle}>{task.title}</Text>
                <Text style={s.taskSub}>{task.duration_min} min</Text>
                {task.memo ? (
                  <Text style={s.taskMemo} numberOfLines={1}>{task.memo}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
            <View style={s.taskActions}>
              <TouchableOpacity
                style={s.startBtn}
                onPress={() => startFocus({ taskMode: 'existing', selectedTaskId: task.id })}
                activeOpacity={0.8}
              >
                <Text style={s.startIcon}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => { play('tap'); handleDeleteTask(task.id, task.title); }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={16} color="rgba(26,22,34,0.40)" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <AddTaskModal
        visible={addTaskOpen}
        category={tab}
        defaultDurationMin={focusDurationMin}
        userId={userId}
        onClose={() => setAddTaskOpen(false)}
        onCreated={(task) => { addTask({ ...task, category: tab }); }}
      />

      <TaskDetailModal
        visible={selectedTaskId !== null}
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 42,
    fontWeight: '500',
    color: INK,
    letterSpacing: -0.5,
  },
  addBtn: {
    height: BTN_SIZE,
    backgroundColor: '#111111',
    borderRadius: 9999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  tabs: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 4 },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: CARD,
  },
  tabPillActive: { backgroundColor: '#111111' },
  tabLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(26,22,34,0.55)' },
  tabLabelActive: { color: '#ffffff', fontWeight: '600' },

  sectionLabel: {
    fontSize: 13,
    color: 'rgba(26,22,34,0.55)',
    letterSpacing: 0.2,
    marginTop: 24,
    marginBottom: 12,
  },

  taskCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 10,
  },
  emptyCard: { justifyContent: 'center', paddingHorizontal: 18 },
  taskInfoPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskIconWrap: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 10,
    backgroundColor: 'rgba(26,22,34,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskIconText: { fontSize: 18 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: INK },
  taskSub: { fontSize: 12, color: 'rgba(26,22,34,0.45)', marginTop: 2 },
  taskMemo: {
    fontSize: 11,
    color: 'rgba(26,22,34,0.40)',
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyText: { fontSize: 13, color: 'rgba(26,22,34,0.40)', textAlign: 'center', paddingVertical: 8 },

  taskActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  startBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startIcon: { fontSize: 16, color: '#ffffff', fontWeight: '700' },
  deleteBtn: { padding: 4 },
});
