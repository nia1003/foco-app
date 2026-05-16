/**
 * MissionsScreen — Quest list + My Tasks (FOCO)
 * v4: Start button on any quest/task opens FocusSetupModal (same flow as HomeScreen)
 */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { DurationSlider } from '@/components/ui/DurationSlider';
import { FocusSetupModal } from '@/components/FocusSetupModal';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { useSound } from '@/components/SoundProvider';
import { getTasks, createTask, deleteTask } from '@/services/focoService';
import { mockPets, mockTasks } from '@/data/mockData';
import type { Task } from '@/types';

const PINK      = '#F2CEDC';
const PINK_TEXT = '#b5607a';

const EMOJI_OPTIONS = [
  '📚', '✏️', '💻', '🎯',
  '💼', '🎨', '🎵', '🏃',
  '🔬', '🌱', '☕', '💡',
  '📝', '🎤', '🏋️', '⭐',
];

type TabType = 'active' | 'daily' | 'special';

type Quest = {
  id: string;
  title: string;
  sub: string;
  progress: number;
  reward: string;
  emoji: string;
  duration_min: number;
};

type QuestsState = Record<TabType, Quest[]>;

const INITIAL_QUESTS: QuestsState = {
  active: [
    { id: 'q1', title: 'Morning Focus Sprint', sub: 'Complete 3 sessions before noon', progress: 0.66, reward: '+30 XP', emoji: '🌅', duration_min: 25 },
    { id: 'q2', title: 'Book Worm',             sub: 'Read for 2 hours total',          progress: 0.45, reward: '+25 XP', emoji: '📚', duration_min: 50 },
    { id: 'q3', title: 'Inbox Zero',             sub: 'Clear your email queue',          progress: 0.20, reward: '+15 XP', emoji: '📬', duration_min: 15 },
  ],
  daily: [
    { id: 'q4', title: 'Daily Checkin', sub: 'Log at least 1 session today',  progress: 0.0, reward: '+5 XP',  emoji: '✅', duration_min: 15 },
    { id: 'q5', title: 'Flow State',    sub: 'Complete a 50-min session',      progress: 0.0, reward: '+20 XP', emoji: '🌊', duration_min: 50 },
  ],
  special: [
    { id: 'q6', title: 'First Week!', sub: 'Complete 7 days in a row', progress: 0.43, reward: '🏆 Trophy', emoji: '⭐', duration_min: 25 },
  ],
};

export default function MissionsScreen() {
  const [tab, setTab] = useState<TabType>('active');
  const { userId } = useAuthStore();
  const { pets, activePet } = usePetStore();
  const { play } = useSound();

  // My Tasks state
  const [tasks, setTasks] = useState<Task[]>(mockTasks.tasks);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Quest state (local only)
  const [questsState, setQuestsState] = useState<QuestsState>(INITIAL_QUESTS);

  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(25);
  const [newEmoji, setNewEmoji] = useState('📚');
  const [newMemo, setNewMemo] = useState('');
  const [creating, setCreating] = useState(false);

  // Focus setup modal (shared with home)
  const [focusModalVisible, setFocusModalVisible] = useState(false);
  const [focusInitialDuration, setFocusInitialDuration] = useState(25);
  const [focusInitialTaskId, setFocusInitialTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getTasks(userId)
      .then((res) => setTasks(res.tasks))
      .catch(() => {});
  }, [userId]);

  const resetCreateModal = () => {
    setNewTitle('');
    setNewDuration(25);
    setNewEmoji('📚');
    setNewMemo('');
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !userId) return;
    try {
      setCreating(true);
      const task = await createTask(userId, newTitle.trim(), newDuration);
      const enriched: Task = { ...task, emoji: newEmoji, memo: newMemo.trim() || undefined };
      setTasks((prev) => [enriched, ...prev]);
      resetCreateModal();
      setShowCreateModal(false);
    } catch {
      Alert.alert('建立失敗', '請稍後再試');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      '刪除任務',
      `確定要刪除「${taskTitle}」嗎？\n已完成的計時紀錄不受影響。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: () => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            deleteTask(taskId).catch(() => {
              setTasks((prev) => {
                if (prev.find((t) => t.id === taskId)) return prev;
                const restored = tasks.find((t) => t.id === taskId);
                return restored ? [restored, ...prev] : prev;
              });
              Alert.alert('刪除失敗', '網路異常，任務已還原，請稍後再試。');
            });
          },
        },
      ],
    );
  };

  const handleDeleteQuest = (questId: string, questTitle: string) => {
    Alert.alert(
      '移除任務',
      `確定要移除「${questTitle}」嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: () => {
            setQuestsState((prev) => ({
              ...prev,
              [tab]: prev[tab].filter((q) => q.id !== questId),
            }));
          },
        },
      ],
    );
  };

  const openFocusModal = (durationMin: number, taskId: string | null) => {
    play('tap');
    setFocusInitialDuration(durationMin);
    setFocusInitialTaskId(taskId);
    setFocusModalVisible(true);
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const currentQuests = questsState[tab];
  const modalPets = pets.length > 0 ? pets : mockPets.slice(0, 1);

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar />

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
            onPress={() => { play('tap'); setShowCreateModal(true); }}
            activeOpacity={0.75}
          >
            <Text style={styles.addBtnText}>+ Task</Text>
          </TouchableOpacity>
        </View>

        {/* Tab pills */}
        <View style={styles.tabs}>
          {(['active', 'daily', 'special'] as TabType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, tab === t && styles.tabPillActive]}
              onPress={() => { play('tap'); setTab(t); }}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quest cards ── */}
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
                      <View style={[styles.progressFill, { width: `${q.progress * 100}%` as any }]} />
                    </View>
                    <Text style={styles.questReward}>{q.reward} · {q.duration_min} min</Text>
                  </View>
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.myTaskStartBtn}
                      onPress={() => openFocusModal(q.duration_min, null)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.myTaskStartText}>▶ Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => { play('tap'); handleDeleteQuest(q.id, q.title); }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color={Colors.inkFaint} />
                    </TouchableOpacity>
                  </View>
                </View>
              </FrostCard>
            </View>
          ))}
        </View>

        {/* ── My Tasks ── */}
        <View style={styles.myTasksSection}>
          <Text style={styles.myTasksLabel}>MY TASKS</Text>

          {pendingTasks.length === 0 && (
            <FrostCard radius={20} padded={false}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tasks yet — add one above!</Text>
              </View>
            </FrostCard>
          )}

          <View style={styles.taskList}>
            {pendingTasks.map((task) => (
              <View key={task.id} style={styles.myTaskWrap}>
                <FrostCard radius={20} padded={false}>
                  <View style={styles.myTaskCard}>
                    <View style={styles.taskEmojiWrap}>
                      <Text style={styles.taskEmoji}>{task.emoji ?? '📝'}</Text>
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
                        onPress={() => openFocusModal(task.duration_min, task.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.myTaskStartText}>▶ Start</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => { play('tap'); handleDeleteTask(task.id, task.title); }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={Colors.inkFaint} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </FrostCard>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Focus Setup Modal (same flow as home) ── */}
      <FocusSetupModal
        visible={focusModalVisible}
        onClose={() => setFocusModalVisible(false)}
        pets={modalPets}
        tasks={pendingTasks}
        initialPetId={activePet?.id ?? null}
        initialDuration={focusInitialDuration}
        initialTaskId={focusInitialTaskId}
      />

      {/* ── Create Task Modal ── */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowCreateModal(false); resetCreateModal(); }}
      >
        <KeyboardAvoidingView
          style={styles.modalKav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => { setShowCreateModal(false); resetCreateModal(); }}
          />
          <View style={styles.modalSheet}>
            <FrostCard radius={28}>
              <Text style={styles.modalTitle}>New Task</Text>

              {/* Emoji picker */}
              <Text style={styles.modalLabel}>PICK AN EMOJI</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={[styles.emojiCell, newEmoji === em && styles.emojiCellActive]}
                    onPress={() => { play('tap'); setNewEmoji(em); }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.emojiCellText}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Task name */}
              <Text style={[styles.modalLabel, { marginTop: 20 }]}>TASK NAME</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="What do you want to focus on?"
                placeholderTextColor={Colors.inkFaint}
                returnKeyType="next"
              />
              <View style={styles.modalUnderline} />

              {/* Memo */}
              <Text style={[styles.modalLabel, { marginTop: 20 }]}>
                MEMO <Text style={styles.optionalTag}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.modalInput}
                value={newMemo}
                onChangeText={(t) => setNewMemo(t.slice(0, 60))}
                placeholder="Short note…"
                placeholderTextColor={Colors.inkFaint}
                returnKeyType="done"
                maxLength={60}
              />
              <View style={styles.modalUnderlineRow}>
                <View style={[styles.modalUnderline, { flex: 1 }]} />
                <Text style={styles.charCount}>{newMemo.length}/60</Text>
              </View>

              {/* Duration slider */}
              <Text style={[styles.modalLabel, { marginTop: 20 }]}>FOCUS DURATION</Text>
              <View style={{ marginTop: 12 }}>
                <DurationSlider value={newDuration} onChange={setNewDuration} />
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => { play('tap'); setShowCreateModal(false); resetCreateModal(); }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCreateBtn, (!newTitle.trim() || creating) && styles.disabled]}
                  disabled={!newTitle.trim() || creating}
                  onPress={() => { play('transition_up'); handleCreate(); }}
                >
                  <Text style={styles.modalCreateText}>{creating ? 'Creating…' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </FrostCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  title: { fontFamily: 'Fraunces_500Medium', fontSize: 42, fontWeight: '500', color: Colors.ink, letterSpacing: -0.5 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, backgroundColor: Colors.ink },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 4 },
  tabPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  tabPillActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  tabLabel: { fontSize: 13, fontWeight: '500', color: Colors.inkSoft },
  tabLabelActive: { color: '#fff', fontWeight: '600' },

  list: { gap: 10, marginTop: 8 },
  taskList: { gap: 10 },
  myTasksSection: { marginTop: 24 },
  myTasksLabel: { fontSize: 10, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6, marginBottom: 10 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.inkFaint },
  myTaskWrap: { marginBottom: 0 },
  myTaskCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  taskEmojiWrap: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(242,206,220,0.35)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  taskEmoji: { fontSize: 22 },
  myTaskInfo: { flex: 1 },
  myTaskTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  myTaskSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 1 },
  myTaskMemo: { fontSize: 11, color: Colors.inkFaint, marginTop: 2, fontStyle: 'italic' },
  progressBg: { marginTop: 7, height: 4, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  progressFill: { height: 4, borderRadius: 9999, backgroundColor: PINK },
  questReward: { fontSize: 10, fontWeight: '600', color: PINK_TEXT, marginTop: 4 },
  taskActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  myTaskStartBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, backgroundColor: PINK },
  myTaskStartText: { fontSize: 12, fontWeight: '700', color: PINK_TEXT },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(20,16,28,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Create Task Modal
  modalKav: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 16 },
  modalTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22, fontWeight: '500', color: Colors.ink, marginBottom: 16,
  },
  modalLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.inkFaint,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
  },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(20,16,28,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  emojiCellActive: { backgroundColor: 'rgba(242,206,220,0.45)', borderColor: PINK_TEXT },
  emojiCellText: { fontSize: 22 },
  modalInput: { fontSize: 17, fontWeight: '500', color: Colors.ink, paddingVertical: 6 },
  modalUnderline: { height: 1.2, backgroundColor: 'rgba(20,16,28,0.15)', marginTop: 4 },
  modalUnderlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  charCount: { fontSize: 10, color: Colors.inkFaint },
  optionalTag: { fontSize: 10, fontWeight: '400', color: Colors.inkFaint, textTransform: 'none' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 9999,
    alignItems: 'center', backgroundColor: 'rgba(20,16,28,0.06)',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },
  modalCreateBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 9999,
    alignItems: 'center', backgroundColor: Colors.ink,
  },
  modalCreateText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  disabled: { opacity: 0.4 },
});
