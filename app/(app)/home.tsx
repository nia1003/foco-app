/**
 * HomeScreen — two-page full-screen layout
 *   Page 1 (light): FOCO bar + hero text + pink CTA + pet carousel
 *   Page 2 (dark):  inline tab bar (Home / Missions / Stats) with global swipe-back gesture
 *
 * Architecture:
 *   GestureDetector (vertical pan — page flip)
 *     Reanimated.View (translateY: 0 = page1, -SCREEN_H = page2)
 *       Page 1  (height: SCREEN_H)
 *       Page 2  (height: SCREEN_H, dark, rounded top corners)
 *         Reanimated.ScrollView  (tab content, scroll-position tracked for gesture priority)
 *         EmbeddedTabBar         (fixed bottom inside dark card)
 *
 *  Carousel lock: after user scrolls to a pet, carousel locks (scrollEnabled=false).
 *  Tap "change ↔" to unlock and browse again.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Reanimated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// ── Constants ─────────────────────────────────────────────────────────────────
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PET_CARD_W       = Math.round(SCREEN_W * 0.72);
const PET_SECTION_H    = Math.min(340, SCREEN_H * 0.38);  // fills ~38% of screen
const SNAP_THRESHOLD   = SCREEN_H * 0.28;
const VELOCITY_THRESHOLD = 600;
const RESISTANCE       = 0.12;

const PINK      = '#F2CEDC';
const PINK_TEXT = '#b5607a';
const INK       = '#1a1622';

const UNLOCKED_DEFS = PETS.filter((p) => !p.locked);

// ── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  return (
    <View style={taskSt.card}>
      <Text style={taskSt.title} numberOfLines={2}>{task.title}</Text>
      <TouchableOpacity style={taskSt.btn} onPress={onPress} activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={taskSt.arrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const taskSt = StyleSheet.create({
  card: {
    width: 140, height: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 16, justifyContent: 'space-between',
  },
  title: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  btn: { width: 32, height: 32, borderRadius: 16, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 14, color: PINK_TEXT, fontWeight: '700' },
});

// ── MissionsRow ───────────────────────────────────────────────────────────────
function MissionsRow({ task, onPress }: { task: Task; onPress: () => void }) {
  return (
    <View style={missSt.row}>
      <View style={missSt.dot} />
      <Text style={missSt.title} numberOfLines={1}>{task.title}</Text>
      <TouchableOpacity style={missSt.btn} onPress={onPress} activeOpacity={0.8}>
        <Text style={missSt.btnText}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

const missSt = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: PINK },
  title: { flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  btn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: PINK,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: 10, color: PINK_TEXT, fontWeight: '700' },
});

// ── EmbeddedTabBar ────────────────────────────────────────────────────────────
type P2Tab = 'home' | 'missions' | 'stats';

function EmbeddedTabBar({
  active,
  onPress,
  bottomInset,
}: {
  active: P2Tab;
  onPress: (t: P2Tab) => void;
  bottomInset: number;
}) {
  const tabs: Array<{ id: P2Tab; label: string; icon: string }> = [
    { id: 'home',     label: 'Home',     icon: '⌂' },
    { id: 'missions', label: 'Tasks',    icon: '☑' },
    { id: 'stats',    label: 'Stats',    icon: '◫' },
  ];
  return (
    <View style={[etbSt.wrapper, { paddingBottom: bottomInset || 10 }]}>
      <View style={etbSt.pill}>
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <TouchableOpacity
              key={tab.id}
              style={etbSt.tab}
              onPress={() => onPress(tab.id)}
              activeOpacity={0.7}
            >
              {isActive && <View style={etbSt.activeHighlight} />}
              <Text style={[etbSt.icon, isActive && etbSt.iconActive]}>{tab.icon}</Text>
              <Text style={[etbSt.label, isActive && etbSt.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const etbSt = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: INK,
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    padding: 6,
  },
  tab:  { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 2, position: 'relative' },
  activeHighlight: {
    position: 'absolute', top: 2, bottom: 2, left: 6, right: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  icon:        { fontSize: 14, color: 'rgba(255,255,255,0.35)' },
  iconActive:  { color: '#fff' },
  label:       { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
  labelActive: { color: '#fff', fontWeight: '600' },
});

// ── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router    = useRouter();
  const { play }  = useSound();
  const insets    = useSafeAreaInsets();
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, restoreActivePet, petsLastFetchedAt } = usePetStore();

  const storePool = pets.length > 0 ? pets : mockPets;

  // ── UI state ─────────────────────────────────────────────────
  const [durationMin, setDurationMin]                 = useState(25);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [pendingTasks, setPendingTasks]               = useState<Task[]>([]);
  const [carouselLocked, setCarouselLocked]           = useState(false);
  const [p2Tab, setP2Tab]                             = useState<P2Tab>('home');

  // ── Reanimated shared values ─────────────────────────────────
  const offset     = useSharedValue(0);          // 0 = Page 1, -SCREEN_H = Page 2
  const curPage    = useSharedValue<0 | 1>(0);
  const page2AtTop = useSharedValue(1);          // 1 = Page2 scroll at top

  const carouselRef = useRef<ScrollView>(null);

  // ── Data fetching ─────────────────────────────────────────────
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

  // Sync carousel to stored active pet on mount
  useEffect(() => {
    if (!activePet?.name) return;
    const idx = UNLOCKED_DEFS.findIndex(
      (p) => p.name.toLowerCase() === activePet.name.toLowerCase() || p.id === activePet.name.toLowerCase(),
    );
    if (idx >= 0) {
      setActiveCarouselIndex(idx);
      setTimeout(() => {
        carouselRef.current?.scrollTo({ x: idx * PET_CARD_W, animated: false });
      }, 80);
    }
  }, [activePet?.name]);

  // ── Derived ──────────────────────────────────────────────────
  const displayName     = userName ?? userEmail?.split('@')[0] ?? 'there';
  const activePetDef    = UNLOCKED_DEFS[activeCarouselIndex] ?? UNLOCKED_DEFS[0];
  const activePetRecord = storePool.find(
    (p) => p.name.toLowerCase() === activePetDef?.id,
  ) ?? storePool[0];

  const deadlineTasks = pendingTasks.filter((t) => t.taskType === 'deadline');
  const dailyTasks    = pendingTasks.filter((t) => t.taskType === 'daily' || !t.taskType);

  // ── Handlers ─────────────────────────────────────────────────
  const goFocus = useCallback((task?: Task) => {
    play('transition_up');
    router.push({
      pathname: '/(app)/focus',
      params: {
        durationMin: String(durationMin),
        petId: activePetRecord?.id ?? '',
        ...(task ? { taskId: task.id, taskTitle: task.title } : {}),
      },
    });
  }, [durationMin, activePetRecord, play, router]);

  const handleCarouselScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x   = e.nativeEvent.contentOffset.x;
    const idx = Math.max(0, Math.min(UNLOCKED_DEFS.length - 1, Math.round(x / PET_CARD_W)));
    setActiveCarouselIndex(idx);
    const def    = UNLOCKED_DEFS[idx];
    const record = storePool.find((p) => p.name.toLowerCase() === def?.id) ?? storePool[0];
    if (record?.id) usePetStore.getState().setActivePet(record.id);
    setCarouselLocked(true);
  }, [storePool]);

  // ── Page 2 scroll tracking ────────────────────────────────────
  const page2ScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      page2AtTop.value = e.contentOffset.y < 8 ? 1 : 0;
    },
  });

  // ── Vertical page-flip gesture ────────────────────────────────
  const panGesture = Gesture.Pan()
    .activeOffsetY([-14, 14])
    .failOffsetX([-22, 22])
    .onUpdate((e) => {
      const isPage2    = curPage.value === 1;
      const base       = isPage2 ? -SCREEN_H : 0;
      const candidate  = base + e.translationY;
      // Block up-swipe while Page 2 is scrolled down (let inner scroll handle it)
      if (isPage2 && e.translationY < 0 && page2AtTop.value < 0.5) return;
      if (candidate > 0) {
        offset.value = candidate * RESISTANCE;
      } else if (candidate < -SCREEN_H) {
        offset.value = -SCREEN_H + (candidate + SCREEN_H) * RESISTANCE;
      } else {
        offset.value = candidate;
      }
    })
    .onEnd((e) => {
      const isPage2 = curPage.value === 1;
      let next: 0 | 1;
      if (!isPage2) {
        next = (e.translationY < -SNAP_THRESHOLD || e.velocityY < -VELOCITY_THRESHOLD) ? 1 : 0;
      } else {
        next = (e.translationY > SNAP_THRESHOLD || e.velocityY > VELOCITY_THRESHOLD) ? 0 : 1;
      }
      offset.value = withSpring(next === 0 ? 0 : -SCREEN_H, {
        damping: 28, stiffness: 85, mass: 1.4, overshootClamping: false,
      });
      curPage.value = next;
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[styles.pagesContainer, animStyle]}>

          {/* ════════════════ PAGE 1 — COVER ════════════════ */}
          <View style={[styles.page1, { height: SCREEN_H }]}>
            {/* FocoBar already handles insets.top internally */}
            <FocoBar avatar={displayName[0]?.toUpperCase() ?? '?'} />

            {/* Hero text — font 33pt (reduced from 38pt to avoid crowding pet) */}
            <View style={styles.heroArea}>
              <Text style={styles.heroLine}>Welcome back</Text>
              <Text style={styles.heroLine}>Start Focus.</Text>
            </View>

            {/* Pink circle CTA */}
            <TouchableOpacity
              style={styles.pinkCircleBtn}
              onPress={() => { play('tap'); goFocus(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.pinkCircleArrow}>→</Text>
            </TouchableOpacity>

            {/* Pet carousel */}
            <View style={[styles.petSection, { height: PET_SECTION_H }]}>
              <ScrollView
                ref={carouselRef}
                horizontal
                scrollEnabled={!carouselLocked}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: (SCREEN_W - PET_CARD_W) / 2 }}
                decelerationRate="fast"
                snapToInterval={PET_CARD_W}
                snapToAlignment="center"
                onMomentumScrollEnd={handleCarouselScroll}
              >
                {UNLOCKED_DEFS.map((def, idx) => (
                  <TouchableOpacity
                    key={def.id}
                    style={{ width: PET_CARD_W, height: PET_SECTION_H, alignItems: 'center', justifyContent: 'flex-end' }}
                    onPress={() => {
                      play('transition_up');
                      router.push({ pathname: '/(app)/pet-info', params: { petId: def.id } });
                    }}
                    activeOpacity={0.9}
                  >
                    <PetRenderer pet={def} size={Math.round(PET_SECTION_H * 0.88)} interactive />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Carousel lock / change-pet control */}
            <View style={styles.carouselControls}>
              {carouselLocked ? (
                <TouchableOpacity
                  style={styles.changePetBtn}
                  onPress={() => setCarouselLocked(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changePetText}>↔ change pet</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.swipeCarouselHint}>← swipe to browse →</Text>
              )}
            </View>

            {/* Swipe-up hint at bottom of Page 1 */}
            <View style={[styles.swipeUpHint, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <Text style={styles.swipeUpArrow}>↑</Text>
              <Text style={styles.swipeUpText}>swipe up</Text>
            </View>
          </View>
          {/* ════════════════ END PAGE 1 ════════════════ */}

          {/* ════════════════ PAGE 2 — DARK DASHBOARD ════════════════ */}
          <View style={[styles.page2, { height: SCREEN_H }]}>
            {/* Pull-down indicator */}
            <View style={styles.page2Handle}>
              <View style={styles.handlePill} />
            </View>

            {/* Tab content — fills flex space above tab bar */}
            <Reanimated.ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.page2Content}
              showsVerticalScrollIndicator={false}
              onScroll={page2ScrollHandler}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
            >
              {p2Tab === 'home' && (
                <>
                  <Text style={styles.greetName}>Hi {displayName},</Text>
                  <Text style={styles.greetSub}>welcome to the headspace.</Text>

                  {/* Timer first */}
                  <Text style={styles.sectionLabel}>TIMER</Text>
                  <View style={styles.gaugeCard}>
                    <TimerGauge value={durationMin} onChange={setDurationMin} />
                  </View>

                  {/* Deadline tasks */}
                  {deadlineTasks.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>DEADLINES</Text>
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

                  {/* Daily tasks */}
                  {dailyTasks.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>DAILY</Text>
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

                  {pendingTasks.length === 0 && (
                    <Text style={styles.emptyTasks}>No pending tasks — all clear 🎉</Text>
                  )}
                </>
              )}

              {p2Tab === 'missions' && (
                <>
                  <Text style={styles.greetName}>Tasks</Text>
                  <Text style={styles.greetSub}>what are you working on?</Text>

                  {deadlineTasks.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>DEADLINES</Text>
                      <View style={styles.listCard}>
                        {deadlineTasks.map((task) => (
                          <MissionsRow key={task.id} task={task} onPress={() => goFocus(task)} />
                        ))}
                      </View>
                    </>
                  )}

                  {dailyTasks.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>DAILY</Text>
                      <View style={styles.listCard}>
                        {dailyTasks.map((task) => (
                          <MissionsRow key={task.id} task={task} onPress={() => goFocus(task)} />
                        ))}
                      </View>
                    </>
                  )}

                  {pendingTasks.length === 0 && (
                    <Text style={styles.emptyTasks}>No tasks yet 🎉</Text>
                  )}

                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => router.push('/(app)/missions' as any)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.viewAllText}>Manage all tasks →</Text>
                  </TouchableOpacity>
                </>
              )}

              {p2Tab === 'stats' && (
                <>
                  <Text style={styles.greetName}>Stats</Text>
                  <Text style={styles.greetSub}>your focus journey.</Text>

                  <View style={styles.statsPreviewCard}>
                    <Text style={styles.statsPreviewLabel}>sessions this week</Text>
                    <Text style={styles.statsPreviewValue}>—</Text>
                  </View>
                  <View style={styles.statsPreviewCard}>
                    <Text style={styles.statsPreviewLabel}>focus time today</Text>
                    <Text style={styles.statsPreviewValue}>—</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => router.push('/(app)/stats' as any)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.viewAllText}>View full statistics →</Text>
                  </TouchableOpacity>
                </>
              )}
            </Reanimated.ScrollView>

            {/* Tab bar lives inside dark card — always visible, slides with it */}
            <EmbeddedTabBar
              active={p2Tab}
              onPress={setP2Tab}
              bottomInset={insets.bottom}
            />
          </View>
          {/* ════════════════ END PAGE 2 ════════════════ */}

        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#faf5ef' },

  pagesContainer: {
    // Two pages stacked vertically; each is SCREEN_H tall
    // GestureDetector wraps the whole thing
  },

  // ── Page 1 ──────────────────────────────────────────────────────
  page1: {
    backgroundColor: '#faf5ef',
    overflow: 'hidden',
  },

  heroArea: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 14,
  },
  heroLine: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 33,           // reduced from 38 → 33pt so it doesn't crowd the pet
    fontWeight: '500',
    color: INK,
    letterSpacing: -0.5,
    lineHeight: 42,
  },

  pinkCircleBtn: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: PINK,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: PINK_TEXT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  pinkCircleArrow: { fontSize: 20, color: PINK_TEXT, fontWeight: '700' },

  petSection: {
    backgroundColor: 'transparent',
  },

  carouselControls: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  changePetBtn: {
    paddingHorizontal: 18, paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: 'rgba(242,206,220,0.25)',
  },
  changePetText: {
    fontSize: 11, color: PINK_TEXT, fontWeight: '600', letterSpacing: 0.3,
  },
  swipeCarouselHint: {
    fontSize: 10, color: 'rgba(26,22,34,0.28)', letterSpacing: 0.3,
  },

  swipeUpHint: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    alignItems: 'center',
    gap: 2,
  },
  swipeUpArrow: { fontSize: 14, color: 'rgba(26,22,34,0.25)' },
  swipeUpText:  { fontSize: 10, color: 'rgba(26,22,34,0.20)', letterSpacing: 0.3 },

  // ── Page 2 ──────────────────────────────────────────────────────
  page2: {
    backgroundColor: INK,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  page2Handle: {
    alignItems: 'center',
    paddingTop: 10, paddingBottom: 4,
  },
  handlePill: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  page2Content: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 16,
  },

  greetName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28, fontWeight: '500',
    color: '#fff', letterSpacing: -0.3,
    marginBottom: 4,
    marginTop: 8,
  },
  greetSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.1, marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 10, fontWeight: '700',
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: 1.4,
    marginTop: 22, marginBottom: 10,
  },

  gaugeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingVertical: 14,
    alignItems: 'center',
  },

  taskRow: { gap: 12, paddingRight: 4 },

  listCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    marginBottom: 4,
  },

  statsPreviewCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18, paddingVertical: 16,
    marginBottom: 10,
  },
  statsPreviewLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  statsPreviewValue: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.80)' },

  emptyTasks: {
    fontSize: 13, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', paddingVertical: 24,
  },

  viewAllBtn: {
    marginTop: 16,
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500',
  },
});
