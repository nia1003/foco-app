/**
 * MissionsScreen — Quest list + My Tasks (FOCO)
 * iOS 26: FocoWallpaper + Glass cards.
 */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
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
import { TabBar } from '@/components/layout/TabBar';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { getTasks, createTask } from '@/services/focoService';
import { mockTasks } from '@/data/mockData';
import type { Task } from '@/types';

const DURATION_OPTIONS = [15, 25, 50, 90];

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

export default function MissionsScreen() {
  const [tab, setTab] = useState<TabType>('active');
  const router = useRouter();
  const { userId } = useAuthStore();

  // ── My Tasks (FOCO) ────────────────────────────
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
        {/* ── My Tasks (FOCO) ──────────────────── */}
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
                      <Text style={styles.myTaskSub}>{task.duration_min} 分鐘</Text>
                    </View>
                    <View style={styles.myTaskStartBtn}>
                      <Text style={styles.myTaskStartText}>▶ 開始</Text>
                    </View>
                  </View>
                </FrostCard>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TabBar />

      {/* ── 新增 Task Modal ──────────────────── */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <FrostCard radius={28}>
            <Text style={styles.modalTitle}>新增任務</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="任務名稱"
              placeholderTextColor={Colors.inkFaint}
              autoFocus
            />
            <View style={styles.modalUnderline} />
            <Text style={styles.modalLabel}>專注時長</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[styles.durationChip, newDuration === min && styles.durationChipActive]}
                  onPress={() => setNewDuration(min)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.durationChipText, newDuration === min && styles.durationChipTextActive]}>
                    {min}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setShowModal(false); setNewTitle(''); }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, (!newTitle.trim() || creating) && styles.disabled]}
                disabled={!newTitle.trim() || creating}
                onPress={handleCreate}
              >
                <Text style={styles.modalCreateText}>{creating ? '建立中…' : '建立'}</Text>
              </TouchableOpacity>
            </View>
          </FrostCard>
        </View>
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
  tabPillActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  tabLabel: { fontSize: 13, fontWeight: '500', color: Colors.inkSoft },
  tabLabelActive: { color: '#fff', fontWeight: '600' },
  list: { gap: 12, marginTop: 8 },
  questCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  questEmoji: { fontSize: 30, width: 44, textAlign: 'center' },
  questInfo: { flex: 1 },
  questTitle: { fontSize: 16, fontWeight: '600', color: Colors.ink },
  questSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  progressBg: { marginTop: 10, height: 5, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  progressFill: { height: 5, borderRadius: 9999, backgroundColor: Colors.pinkHot },
  questMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  questPct: { fontSize: 10, color: Colors.inkFaint, letterSpacing: 0.3 },
  questReward: { fontSize: 10, fontWeight: '600', color: Colors.pinkHot },
  // My Tasks
  myTasksSection: { marginTop: 24 },
  myTasksLabel: { fontSize: 10, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6, marginBottom: 8 },
  myTaskWrap: { marginBottom: 10 },
  myTaskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  myTaskInfo: { flex: 1 },
  myTaskTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  myTaskSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  myTaskStartBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999, backgroundColor: Colors.pinkHot },
  myTaskStartText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end', padding: 16, paddingBottom: 40 },
  modalTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 22, fontWeight: '500', color: Colors.ink, marginBottom: 20 },
  modalInput: { fontSize: 18, fontWeight: '500', color: Colors.ink, paddingVertical: 6 },
  modalUnderline: { height: 1.2, backgroundColor: 'rgba(20,16,28,0.15)', marginBottom: 20 },
  modalLabel: { fontSize: 11, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  durationChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.06)', borderWidth: 1, borderColor: 'transparent' },
  durationChipActive: { backgroundColor: 'rgba(232,71,151,0.12)', borderColor: Colors.pinkHot },
  durationChipText: { fontSize: 13, fontWeight: '600', color: Colors.inkSoft },
  durationChipTextActive: { color: Colors.pinkHot },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 9999, alignItems: 'center', backgroundColor: 'rgba(20,16,28,0.06)' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },
  modalCreateBtn: { flex: 1, paddingVertical: 14, borderRadius: 9999, alignItems: 'center', backgroundColor: Colors.ink },
  modalCreateText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  disabled: { opacity: 0.4 },
});
