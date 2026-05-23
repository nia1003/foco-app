/**
 * HomeScreen — two-section layout
 *   Top (light): FOCO bar + "Welcome back / Start Focus." + pink CTA + pet carousel
 *   Bottom (dark): greeting + timer gauge + deadlines + daily tasks
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { FocoBar } from '@/components/layout/FocoBar';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { TimerGauge } from '@/components/home/TimerGauge';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { getPets, getTasks } from '@/services/focoService';
import { mockPets, mockTasks } from '@/data/mockData';
import type { Task } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const PET_CARD_W  = Math.round(SCREEN_W * 0.72);
const PET_SECTION_H = 280;
const DARK_OVERLAP  = 55;

// Design tokens from Figma export
const LIGHT_BG   = '#fbfbfb';
const DARK_BG    = '#252525';
const PINK       = '#ffc8ef';
const INK        = '#1a1622';

const UNLOCKED_DEFS = PETS.filter((p) => !p.locked);

// ── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  return (
    <View style={taskStyles.card}>
      <Text style={taskStyles.title} numberOfLines={2}>{task.title}</Text>
      <TouchableOpacity
        style={taskStyles.btn}
        onPress={onPress}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={taskStyles.arrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const taskStyles = StyleSheet.create({
  card: {
    width: 137,
    height: 135,
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.90)',
    paddingHorizontal: 22,
    paddingVertical: 18,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: INK,
    lineHeight: 16,
    alignSelf: 'flex-start',
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 34,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 20,
    color: INK,
    fontWeight: '700',
    letterSpacing: 2,
  },
});

// ── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router   = useRouter();
  const { play } = useSound();
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, restoreActivePet, petsLastFetchedAt } = usePetStore();

  const storePool = pets.length > 0 ? pets : mockPets;

  const [durationMin, setDurationMin]                 = useState(25);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [pendingTasks, setPendingTasks]               = useState<Task[]>([]);

  // Staleness guard for task list
  const tasksLastFetchedAt = useRef<number | null>(null);
  const TASKS_STALE_MS = 5 * 60 * 1000;

  // ── Data fetching ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const STALE_MS = 5 * 60 * 1000;
    const isStale  = !petsLastFetchedAt || Date.now() - petsLastFetchedAt > STALE_MS;
    if (pets.length && !isStale) { restoreActivePet(); return; }
    getPets(userId)
      .then((fetched) => { setPets(fetched); restoreActivePet(); })
      .catch(() => { if (!pets.length) setPets(mockPets); });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setPendingTasks(mockTasks.tasks.filter((t) => t.status === 'pending'));
      tasksLastFetchedAt.current = null;
      return;
    }
    const isStale = !tasksLastFetchedAt.current ||
      Date.now() - tasksLastFetchedAt.current > TASKS_STALE_MS;
    if (!isStale) return;
    getTasks(userId)
      .then((res) => {
        setPendingTasks(res.tasks.filter((t) => t.status === 'pending'));
        tasksLastFetchedAt.current = Date.now();
      })
      .catch(() => setPendingTasks(mockTasks.tasks.filter((t) => t.status === 'pending')));
  }, [userId]);

  // Sync carousel index to stored active pet on mount
  useEffect(() => {
    if (!activePet?.name) return;
    const idx = UNLOCKED_DEFS.findIndex(
      (p) => p.name.toLowerCase() === activePet.name.toLowerCase(),
    );
    if (idx >= 0) setActiveCarouselIndex(idx);
  }, [activePet?.name]);

  // ── Derived ────────────────────────────────────────────────────
  const displayName     = userName ?? userEmail?.split('@')[0] ?? 'there';
  const activePetDef    = UNLOCKED_DEFS[activeCarouselIndex] ?? UNLOCKED_DEFS[0];
  const activePetRecord = storePool.find(
    (p) => p.name.toLowerCase() === activePetDef?.id,
  ) ?? storePool[0];

  // taskType is a local-only field; backend tasks land in dailyTasks via !t.taskType
  const deadlineTasks = pendingTasks.filter((t) => t.taskType === 'deadline');
  const dailyTasks    = pendingTasks.filter((t) => t.taskType === 'daily' || !t.taskType);

  // ── Handlers ───────────────────────────────────────────────────
  const goFocus = (task?: Task) => {
    play('transition_up');
    router.push({
      pathname: '/(app)/focus',
      params: {
        durationMin: String(durationMin),
        petId: activePetRecord?.id ?? '',
        taskId: task?.id ?? '',
        ...(task ? { taskTitle: task.title } : {}),
      },
    });
  };

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const idx    = Math.max(0, Math.min(UNLOCKED_DEFS.length - 1, Math.round(offset / PET_CARD_W)));
    setActiveCarouselIndex(idx);

    const def    = UNLOCKED_DEFS[idx];
    const record = storePool.find((p) => p.name.toLowerCase() === def?.id) ?? storePool[0];
    if (record?.id) usePetStore.getState().setActivePet(record.id);
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── LIGHT SECTION ──────────────────────────────────── */}
        <View style={styles.lightSection}>
          <FocoBar avatar={displayName[0]?.toUpperCase() ?? '?'} />
          <View style={styles.heroArea}>
            <Text style={styles.heroLine}>{'Welcome\nback\nStart Focus.'}</Text>
          </View>
          <TouchableOpacity
            style={styles.pinkCircleBtn}
            onPress={() => { play('tap'); goFocus(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.pinkCircleArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ── PET CAROUSEL ───────────────────────────────────── */}
        <View style={styles.petSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.petRow,
              { paddingHorizontal: (SCREEN_W - PET_CARD_W) / 2 },
            ]}
            decelerationRate="fast"
            snapToInterval={PET_CARD_W}
            snapToAlignment="center"
            onMomentumScrollEnd={handleCarouselScroll}
          >
            {UNLOCKED_DEFS.map((def) => (
              <TouchableOpacity
                key={def.id}
                style={[styles.petCard, { width: PET_CARD_W }]}
                onPress={() => {
                  play('transition_up');
                  router.push({ pathname: '/(app)/pet-info', params: { petId: def.id } });
                }}
                activeOpacity={0.9}
              >
                <PetRenderer pet={def} size={230} interactive />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── DARK SECTION ───────────────────────────────────── */}
        <View style={styles.darkSection}>
          <Text style={styles.greetName}>Hi {displayName},</Text>
          <Text style={styles.greetSub}>welcome to the headspace.</Text>

          <Text style={styles.sectionLabel}>timer</Text>
          <View style={styles.gaugeCard}>
            <TimerGauge value={durationMin} onChange={setDurationMin} />
          </View>

          {deadlineTasks.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>deadlines</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.taskRow}
                nestedScrollEnabled
              >
                {deadlineTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onPress={() => goFocus(task)} />
                ))}
              </ScrollView>
            </>
          )}

          {dailyTasks.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Daily</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.taskRow}
                nestedScrollEnabled
              >
                {dailyTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onPress={() => goFocus(task)} />
                ))}
              </ScrollView>
            </>
          )}

          <View style={styles.bottomPad} />
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: LIGHT_BG },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // ── Light section ───────────────────────────────────────────────
  lightSection: {
    backgroundColor: LIGHT_BG,
    zIndex: 20,
  },
  heroArea: {
    paddingHorizontal: 38,
    paddingTop: 12,
    paddingBottom: 20,
  },
  heroLine: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 54,
    fontWeight: '600',
    color: INK,
    letterSpacing: 1,
    lineHeight: 58,
  },
  pinkCircleBtn: {
    width: 69,
    height: 69,
    borderRadius: 34,
    backgroundColor: PINK,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#c07090',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  pinkCircleArrow: {
    fontSize: 32,
    color: INK,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // ── Pet carousel ────────────────────────────────────────────────
  petSection: {
    height: PET_SECTION_H,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  petRow:  { gap: 0 },
  petCard: {
    height: PET_SECTION_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // ── Dark section ────────────────────────────────────────────────
  darkSection: {
    backgroundColor: DARK_BG,
    borderTopLeftRadius:  40,
    borderTopRightRadius: 40,
    marginTop: -DARK_OVERLAP,
    paddingTop: DARK_OVERLAP + 28,
    paddingHorizontal: 29,
    zIndex: 10,
    minHeight: 520,
  },

  greetName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.4,
    lineHeight: 44,
    marginBottom: 6,
  },
  greetSub: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: -0.2,
    marginBottom: 28,
  },

  sectionLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.71)',
    letterSpacing: 0.2,
    marginTop: 24,
    marginBottom: 12,
  },

  gaugeCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },

  taskRow: {
    gap: 12,
    paddingRight: 4,
  },

  bottomPad: { height: 60 },
});
