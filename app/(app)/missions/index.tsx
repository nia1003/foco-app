/**
 * MissionsScreen — Quest list + My Tasks (FOCO)
 * v2: emoji picker, memo field, delete task (soft)
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
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { AppBackground } from '@/components/ui/AppBackground';
import { Glass } from '@/components/ui/Glass';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { getTasks, createTask, deleteTask } from '@/services/focoService';
import { mockTasks } from '@/data/mockData';
import type { Task } from '@/types';

// ── 品牌淺粉色 ────────────────────────────────
const PINK = '#F2CEDC';
const PINK_TEXT = '#b5607a';

// ── Emoji options ─────────────────────────────
const EMOJI_OPTIONS = [
  '📚', '✏️', '💻', '🎯',
  '💼', '🎨', '🎵', '🏃',
  '🔬', '🌱', '☕', '💡',
  '📝', '🎤', '🏋️', '⭐',
];

// ── Duration Slider（5–120 分鐘）────────────────
const MIN_DUR = 5;
const MAX_DUR = 120;

function DurationSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = (value - MIN_DUR) / (MAX_DUR - MIN_DUR);
  const thumbLeft = trackWidth > 0 ? progress * (trackWidth - 24) : 0;

  const handleTouch = (x: number) => {
    if (trackWidth === 0) return;
    const clamped = Math.max(0, Math.min(trackWidth, x));
    const ratio = clamped / trackWidth;
    const newVal = Math.round(MIN_DUR + ratio * (MAX_DUR - MIN_DUR));
    onChange(Math.max(MIN_DUR, Math.min(MAX_DUR, newVal)));
  };

  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.minLabel}>{MIN_DUR}m</Text>
        <Text style={sliderStyles.valueLabel}>{value} min</Text>
        <Text style={sliderStyles.maxLabel}>{MAX_DUR}m</Text>
      </View>

      <View
        style={sliderStyles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
      >
        <View style={[sliderStyles.fill, { width: `${progress * 100}%` as any }]} />
        <View style={[sliderStyles.thumb, { left: thumbLeft }]} />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  minLabel: { fontSize: 11, color: Colors.inkFaint },
  maxLabel: { fontSize: 11, color: Colors.inkFaint },
  valueLabel: { fontSize: 15, fontWeight: '700', color: PINK_TEXT },
  track: {
    height: 6, borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    justifyContent: 'center',
  },
  fill: { height: 6, borderRadius: 9999, backgroundColor: PINK, position: 'absolute', left: 0 },
  thumb: {
    position: 'absolute',
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2, borderColor: PINK_TEXT,
    top: -9,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
});

// ── Quest data ───────────────────────────────
type TabType = 'active' | 'daily' | 'special';

const QUESTS = {
  active: [
    { id: '1', title: 'Morning Focus Sprint', sub: 'Complete 3 sessions before noon', progress: 0.66, reward: '+30 XP', emoji: '🌅' },
    { id: '2', title: 'Book Worm', sub: 'Read for 2 hours total', progress: 0.45, reward: '+25 XP', emoji: '📚' },
    { id: '3', title: 'Inbox Zero', sub: 'Clear your email queue', progress: 0.2, reward: '+15 XP', emoji: '📬' },
  ],
  daily: [
    { id: '4', title: 'Daily Checkin', sub: 'Log at least 1 session today', progress: 0.0, reward: '+5 XP', emoji: '✅' },
    { id: '5', title: 'Flow State', sub: 'Complete a 50-min session', progress: 0.0, reward: '+20 XP', emoji: '🌊' },
  ],
  special: [
    { id: '6', title: 'First Week!', sub: 'Complete 7 days in a row', progress: 0.43, reward: '🏆 Trophy', emoji: '⭐' },
  ],
};

// ── Main Screen ──────────────────────────────
export default function MissionsScreen() {
  const [tab, setTab] = useState<TabType>('active');
  const router = useRouter();
  const { userId } = useAuthStore();

  const [tasks, setTasks] = useState<Task[]>(mockTasks.tasks);
  const [showModal, setShowModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(25);
  const [newEmoji, setNewEmoji] = useState('📚');
  const [newMemo, setNewMemo] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getTasks(userId)
      .then((res) => setTasks(res.tasks))
      .catch(() => {});
  }, [userId]);

  const resetModal = () => {
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
      // Merge local-only fields (emoji, memo) into the returned task
      const enriched: Task = { ...task, emoji: newEmoji, memo: newMemo.trim() || undefined };
      setTasks((prev) => [enriched, ...prev]);
      resetModal();
      setShowModal(false);
    } catch {
      Alert.alert('建立失敗', '請稍後再試');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (taskId: string, taskTitle: string) => {
    Alert.alert(
      '刪除任務',
      `確定要刪除「${taskTitle}」嗎？\n已完成的計時紀錄不受影響。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
            } catch {
              Alert.alert('刪除失敗', '請稍後再試');
            }
          },
        },
      ],
    );
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const quests = QUESTS[tab];

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
            onPress={() => setShowModal(true)}
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
              onPress={() => setTab(t)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quest cards */}
        <View style={styles.list}>
          {quests.map((q) => (
            <TouchableOpacity
              key={q.id}
              onPress={() => router.push(`/(app)/missions/${q.id}` as any)}
              activeOpacity={0.85}
            >
              <Glass radius={24} tone="chrome" padded={false}>
                <View style={styles.questCard}>
                  <Text style={styles.questEmoji}>{q.emoji}</Text>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{q.title}</Text>
                    <Text style={styles.questSub}>{q.sub}</Text>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${q.progress * 100}%` as any }]} />
                    </View>
                    <View style={styles.questMeta}>
                      <Text style={styles.questPct}>{Math.round(q.progress * 100)}% complete</Text>
                      <Text style={styles.questReward}>{q.reward}</Text>
                    </View>
                  </View>
                </View>
              </Glass>
            </TouchableOpacity>
          ))}
        </View>

        {/* My Tasks */}
        <View style={styles.myTasksSection}>
          <Text style={styles.myTasksLabel}>MY TASKS</Text>

          {pendingTasks.length === 0 && (
            <FrostCard radius={20} padded={false}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tasks yet — add one above!</Text>
              </View>
            </FrostCard>
          )}

          {pendingTasks.map((task) => (
            <View key={task.id} style={styles.myTaskWrap}>
              <FrostCard radius={20} padded={false}>
                <View style={styles.myTaskCard}>
                  {/* Emoji badge */}
                  <View style={styles.taskEmojiWrap}>
                    <Text style={styles.taskEmoji}>{task.emoji ?? '📝'}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.myTaskInfo}>
                    <Text style={styles.myTaskTitle}>{task.title}</Text>
                    <Text style={styles.myTaskSub}>{task.duration_min} min</Text>
                    {task.memo ? (
                      <Text style={styles.myTaskMemo} numberOfLines={1}>{task.memo}</Text>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.myTaskStartBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/focus',
                          params: { durationMin: String(task.duration_min), taskId: task.id },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.myTaskStartText}>▶ Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(task.id, task.title)}
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
      </ScrollView>

      {/* ── Add Task Modal ─────────────────────── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => { setShowModal(false); resetModal(); }}>
        <KeyboardAvoidingView
          style={styles.modalKav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => { setShowModal(false); resetModal(); }}
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
                    onPress={() => setNewEmoji(em)}
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
              <Text style={[styles.modalLabel, { marginTop: 20 }]}>MEMO <Text style={styles.optionalTag}>(optional)</Text></Text>
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
                  onPress={() => { setShowModal(false); resetModal(); }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCreateBtn, (!newTitle.trim() || creating) && styles.disabled]}
                  disabled={!newTitle.trim() || creating}
                  onPress={handleCreate}
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
  root: { flex: 1, backgroundColor: Colors.beige },
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
  list: { gap: 12, marginTop: 8 },
  questCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  questEmoji: { fontSize: 30, width: 44, textAlign: 'center' },
  questInfo: { flex: 1 },
  questTitle: { fontSize: 16, fontWeight: '600', color: Colors.ink },
  questSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  progressBg: { marginTop: 10, height: 5, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  progressFill: { height: 5, borderRadius: 9999, backgroundColor: PINK },
  questMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  questPct: { fontSize: 10, color: Colors.inkFaint, letterSpacing: 0.3 },
  questReward: { fontSize: 10, fontWeight: '600', color: PINK_TEXT },
  // My Tasks
  myTasksSection: { marginTop: 24 },
  myTasksLabel: { fontSize: 10, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6, marginBottom: 10 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.inkFaint },
  myTaskWrap: { marginBottom: 10 },
  myTaskCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  taskEmojiWrap: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(242,206,220,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  taskEmoji: { fontSize: 22 },
  myTaskInfo: { flex: 1 },
  myTaskTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  myTaskSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 1 },
  myTaskMemo: { fontSize: 11, color: Colors.inkFaint, marginTop: 2, fontStyle: 'italic' },
  taskActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  myTaskStartBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, backgroundColor: PINK },
  myTaskStartText: { fontSize: 12, fontWeight: '700', color: PINK_TEXT },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(20,16,28,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  // Modal
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
  // Emoji grid
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(20,16,28,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  emojiCellActive: {
    backgroundColor: 'rgba(242,206,220,0.45)',
    borderColor: PINK_TEXT,
  },
  emojiCellText: { fontSize: 22 },
  // Input
  modalInput: { fontSize: 17, fontWeight: '500', color: Colors.ink, paddingVertical: 6 },
  modalUnderline: { height: 1.2, backgroundColor: 'rgba(20,16,28,0.15)', marginTop: 4 },
  modalUnderlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  charCount: { fontSize: 10, color: Colors.inkFaint },
  optionalTag: { fontSize: 10, fontWeight: '400', color: Colors.inkFaint, textTransform: 'none' },
  // Actions
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
