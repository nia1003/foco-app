/**
 * MissionsScreen — Quest list + My Tasks (FOCO)
 */
import React, { useEffect, useRef, useState } from 'react';
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
import { AppBackground } from '@/components/ui/AppBackground';
import { Glass } from '@/components/ui/Glass';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { getTasks, createTask } from '@/services/focoService';
import { mockTasks } from '@/data/mockData';
import type { Task } from '@/types';

// ── 品牌淺粉色 ────────────────────────────────
const PINK = '#F2CEDC';
const PINK_TEXT = '#b5607a';   // 深一點讓文字可讀

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

      {/* Track */}
      <View
        style={sliderStyles.track}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
      >
        {/* Fill */}
        <View style={[sliderStyles.fill, { width: `${progress * 100}%` as any }]} />
        {/* Thumb */}
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
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(25);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userId) return;
    getTasks(userId)
      .then((res) => setTasks(res.tasks))
      .catch(() => {});
  }, [userId]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !userId) return;
    try {
      setCreating(true);
      const task = await createTask(userId, newTitle.trim(), newDuration);
      setTasks((prev) => [task, ...prev]);
      setNewTitle('');
      setNewDuration(25);
      setShowModal(false);
    } catch {
      Alert.alert('建立失敗', '請稍後再試');
    } finally {
      setCreating(false);
    }
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
        {pendingTasks.length > 0 && (
          <View style={styles.myTasksSection}>
            <Text style={styles.myTasksLabel}>MY TASKS</Text>
            {pendingTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/focus',
                    params: { durationMin: String(task.duration_min), taskId: task.id },
                  })
                }
                activeOpacity={0.85}
                style={styles.myTaskWrap}
              >
                <FrostCard radius={20} padded={false}>
                  <View style={styles.myTaskCard}>
                    <View style={styles.myTaskInfo}>
                      <Text style={styles.myTaskTitle}>{task.title}</Text>
                      <Text style={styles.myTaskSub}>{task.duration_min} min</Text>
                    </View>
                    <View style={styles.myTaskStartBtn}>
                      <Text style={styles.myTaskStartText}>▶ Start</Text>
                    </View>
                  </View>
                </FrostCard>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Add Task Modal ─────────────────────── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalKav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => { setShowModal(false); setNewTitle(''); }}
          />
          <View style={styles.modalSheet}>
            <FrostCard radius={28}>
              <Text style={styles.modalTitle}>New Task</Text>

              {/* Task name */}
              <Text style={styles.modalLabel}>TASK NAME</Text>
              <TextInput
                style={styles.modalInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="What do you want to focus on?"
                placeholderTextColor={Colors.inkFaint}
                autoFocus
                returnKeyType="done"
              />
              <View style={styles.modalUnderline} />

              {/* Duration slider */}
              <Text style={[styles.modalLabel, { marginTop: 24 }]}>FOCUS DURATION</Text>
              <View style={{ marginTop: 12 }}>
                <DurationSlider value={newDuration} onChange={setNewDuration} />
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => { setShowModal(false); setNewTitle(''); setNewDuration(25); }}
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
  myTasksLabel: { fontSize: 10, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6, marginBottom: 8 },
  myTaskWrap: { marginBottom: 10 },
  myTaskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  myTaskInfo: { flex: 1 },
  myTaskTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  myTaskSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  myTaskStartBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: PINK },
  myTaskStartText: { fontSize: 12, fontWeight: '700', color: PINK_TEXT },
  // Modal
  modalKav: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 16 },
  modalTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22, fontWeight: '500', color: Colors.ink, marginBottom: 20,
  },
  modalLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.inkFaint,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
  },
  modalInput: { fontSize: 17, fontWeight: '500', color: Colors.ink, paddingVertical: 6 },
  modalUnderline: { height: 1.2, backgroundColor: 'rgba(20,16,28,0.15)', marginTop: 4 },
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
