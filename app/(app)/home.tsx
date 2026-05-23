/**
 * HomeScreen — two-section layout
 *   Top (light): FOCO bar + "Welcome back / Start Focus." + pink CTA + pet carousel
 *   Bottom (dark): greeting + timer gauge + deadlines + daily tasks
 */
import React, { useEffect, useState } from 'react';
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
const PET_CARD_W = Math.round(SCREEN_W * 0.72);
const PET_SECTION_H = 260;
const DARK_OVERLAP = 60;

const PINK      = '#F2CEDC';
const PINK_TEXT = '#b5607a';
const INK       = '#1a1622';

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
    width: 140,
    height: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 16,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 14,
    color: PINK_TEXT,
    fontWeight: '700',
  },
});

// ── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router   = useRouter();
  const { play } = useSound();
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, restoreActivePet, petsLastFetchedAt } = usePetStore();

  const storePool = pets.length > 0 ? pets : mockPets;

  const [durationMin, setDurationMin]                   = useState(25);
  const [activeCarouselIndex, setActiveCarouselIndex]   = useState(0);
  const [pendingTasks, setPendingTasks]                 = useState<Task[]>([]);

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
      return;
    }
    getTasks(userId)
      .then((res) => setPendingTasks(res.tasks.filter((t) => t.status === 'pending')))
      .catch(() => setPendingTasks(mockTasks.tasks.filter((t) => t.status === 'pending')));
  }, [userId]);

  // Sync carousel index to stored active pet on mount
  useEffect(() => {
    if (!activePet?.name) return;
    const idx = UNLOCKED_DEFS.findIndex(
      (p) => p.name.toLowerCase() === activePet.name.toLowerCase() || p.id === activePet.name.toLowerCase(),
    );
    if (idx >= 0) setActiveCarouselIndex(idx);
  }, [activePet?.name]);

  // ── Derived ────────────────────────────────────────────────────
  const displayName     = userName ?? userEmail?.split('@')[0] ?? 'there';
  const activePetDef    = UNLOCKED_DEFS[activeCarouselIndex] ?? UNLOCKED_DEFS[0];
  const activePetRecord = storePool.find(
    (p) => p.name.toLowerCase() === activePetDef?.id,
  ) ?? storePool[0];

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
        ...(task ? { taskId: task.id, taskTitle: task.title } : {}),
      },
    });
  };

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const idx    = Math.max(0, Math.min(UNLOCKED_DEFS.length - 1, Math.round(offset / PET_CARD_W)));
    setActiveCarouselIndex(idx);

    // Persist selection so it survives navigation away-and-back
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
            <Text style={styles.heroLine}>Welcome back</Text>
            <Text style={styles.heroLine}>Start Focus.</Text>
          </View>
          {/* Pink circle CTA — free focus, no task */}
          <TouchableOpacity
            style={styles.pinkCircleBtn}
            onPress={() => { play('tap'); goFocus(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.pinkCircleArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ── PET CAROUSEL (transparent bg, sits above dark section) ── */}
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
  root:          { flex: 1, backgroundColor: '#faf5ef' },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  lightSection: {
    backgroundColor: '#faf5ef',
    zIndex: 20,
  },
  heroArea: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 16,
  },
  heroLine: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 38,
    fontWeight: '500',
    color: INK,
    letterSpacing: -0.6,
    lineHeight: 46,
  },
  pinkCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PINK,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: PINK_TEXT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  pinkCircleArrow: {
    fontSize: 20,
    color: PINK_TEXT,
    fontWeight: '700',
  },

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

  darkSection: {
    backgroundColor: INK,
    borderTopLeftRadius:  32,
    borderTopRightRadius: 32,
    marginTop: -DARK_OVERLAP,
    paddingTop: DARK_OVERLAP + 28,
    paddingHorizontal: 22,
    zIndex: 10,
    minHeight: 480,
  },

  greetName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  greetSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.1,
    marginBottom: 24,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 10,
  },

  gaugeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },

  taskRow: {
    gap: 12,
    paddingRight: 4,
  },

  bottomPad: { height: 48 },
});
