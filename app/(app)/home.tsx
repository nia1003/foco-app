/**
 * HomeScreen — vertical two-page layout (Reanimated + RNGH)
 *   Page 1 (exactly SCREEN_H, light, NO tab bar):  FocoBar + hero + pet carousel + chat
 *   Page 2 (exactly SCREEN_H, dark, has tab bar):  Dashboard | Tasks | Stats
 *
 * The two pages stack vertically. A PanGestureHandler drives a spring-based
 * translateY that moves the page stack, giving heavy rubber-band damping.
 * Page 2 never bleeds into Page 1 at rest.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { FocoBar } from '@/components/layout/FocoBar';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { TimerGauge } from '@/components/home/TimerGauge';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTaskStore } from '@/stores/taskStore';
import { chatWithPet, getPets } from '@/services/focoService';
import { mockPets } from '@/data/mockData';
import type { Task, TaskCategory } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PET_CARD_W    = Math.round(SCREEN_W * 0.72);
const PET_SECTION_H = 440;
const HERO_SECTION_H = SCREEN_H - PET_SECTION_H; // fills rest of page 1
const EMBEDDED_TAB_RESERVED = 96;

const LIGHT_BG = '#EFE8E0';
const DARK_BG  = 'rgba(255,255,255,0.98)';
const PINK     = '#ffc8ef';
const INK      = '#1a1622';

const UNLOCKED_DEFS = PETS.filter((p) => !p.locked);

type Page2Tab = 'home' | 'tasks' | 'stats';

// ── Per-pet random greetings ──────────────────────────────────────────────────
const PET_GREETINGS: Record<string, string[]> = {
  sunion: [
    "Ready to focus? Let's go! 🌟",
    "You've got this! I believe in you 💪",
    "One focused session at a time ✨",
    "Today is a great day to start 🌻",
  ],
  lily: [
    "Bloom where you're planted 🌸",
    "Growth takes patience — you're doing great!",
    "Let's make today count 🌺",
    "Every step forward matters 🌿",
  ],
  fluff: [
    "Poof! Let's make magic happen ✨",
    "Soft focus, big results 🌙",
    "I'm here with you every step 💙",
    "Float into your flow state 🫧",
  ],
  stay: [
    "Reaching for the stars ⭐",
    "You shine brightest when you focus 🌟",
    "Let's conquer today! 💫",
    "Starry focus coming right up ✦",
  ],
};

// ── TaskCard ──────────────────────────────────────────────────────────────────
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
    borderRadius: 16,
    backgroundColor: '#E6E6E6',
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: INK,
    lineHeight: 16,
    alignSelf: 'flex-start',
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 2,
  },
});

// ── EmbeddedTabBar ────────────────────────────────────────────────────────────
// Physically lives inside the dark card — moves WITH it, never floats globally.
interface EmbeddedTabBarProps {
  active: Page2Tab;
  onPress: (tab: Page2Tab) => void;
}
function EmbeddedTabBar({ active, onPress }: EmbeddedTabBarProps) {
  const tabs: Array<{ id: Page2Tab; label: string; icon: string }> = [
    { id: 'home',  label: 'Home',  icon: '⌂' },
    { id: 'tasks', label: 'Tasks', icon: '☑' },
    { id: 'stats', label: 'Stats', icon: '◫' },
  ];
  return (
    <View style={etbStyles.wrapper} pointerEvents="box-none">
      <View style={etbStyles.pill}>
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <TouchableOpacity
              key={tab.id}
              style={etbStyles.tab}
              onPress={() => onPress(tab.id)}
              activeOpacity={0.7}
            >
              {isActive && <View style={etbStyles.activeHighlight} />}
              <Text style={[etbStyles.icon, isActive && etbStyles.iconActive]}>
                {tab.icon}
              </Text>
              <Text style={[etbStyles.label, isActive && etbStyles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const etbStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 22,
    left: 14,
    right: 14,
    zIndex: 30,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: 'rgba(26,22,34,0.10)',
    backgroundColor: 'rgba(230,230,230,0.85)',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    position: 'relative',
  },
  activeHighlight: {
    position: 'absolute',
    top: 2, bottom: 2, left: 8, right: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(26,22,34,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(26,22,34,0.12)',
  },
  icon: {
    fontSize: 16,
    color: 'rgba(26,22,34,0.35)',
  },
  iconActive: {
    color: '#1a1622',
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.1,
    color: 'rgba(26,22,34,0.40)',
    fontWeight: '500',
  },
  labelActive: {
    color: '#1a1622',
    fontWeight: '600',
  },
});

// ── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router   = useRouter();
  const { play } = useSound();
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, restoreActivePet, petsLastFetchedAt } = usePetStore();
  const { tasks, addTask, fetchTasks } = useTaskStore();
  const avatarUri = usePreferencesStore((s) => s.avatarUri);

  const storePool = pets.length > 0 ? pets : mockPets;

  const [durationMin, setDurationMin]                 = useState(25);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [activePage2Tab, setActivePage2Tab]           = useState<Page2Tab>('home');
  const [addTaskCategory, setAddTaskCategory]         = useState<TaskCategory | null>(null);

  // ref used for programmatic smooth-scroll to centre after snap
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const carouselRef = useRef<any>(null);

  // Pet chat state
  const [chat, setChat] = useState<{ visible: boolean; msg: string; text: string; loading: boolean; err: string }>({
    visible: false, msg: '', text: '', loading: false, err: '',
  });
  const chatInputRef = useRef<TextInput>(null);

  // Drives per-pet scale/opacity on native thread (60fps) for the carousel
  const scrollX = useRef(new Animated.Value(0)).current;

  // ── Reanimated page-transition state ───────────────────────────
  // offset = 0      → Page 1 fully visible
  // offset = -SCREEN_H → Page 2 fully visible
  const offset   = useSharedValue(0);
  const curPage  = useSharedValue<0 | 1>(0); // worklet-readable page index
  const [page, setPage] = useState<0 | 1>(0);  // React-side mirror for effects

  // ── Pan gesture: Page 1 → Page 2 swipe-up only ────────────────
  // Page 2 is locked — no drag-back; use the ↑ button in top-right corner instead.
  const SNAP_THRESHOLD     = SCREEN_H * 0.28;
  const VELOCITY_THRESHOLD = 600;
  const RESISTANCE = 0.12;

  const panGesture = Gesture.Pan()
    .activeOffsetY([-14, 14])
    .failOffsetX([-22, 22])
    .onUpdate((e) => {
      if (curPage.value === 1) return; // Page 2 is locked — no drag
      const candidate = e.translationY;
      if (candidate > 0) {
        offset.value = candidate * RESISTANCE; // rubber-band downward
      } else if (candidate < -SCREEN_H) {
        offset.value = -SCREEN_H + (candidate + SCREEN_H) * RESISTANCE;
      } else {
        offset.value = candidate;
      }
    })
    .onEnd((e) => {
      if (curPage.value === 1) return; // locked on page 2
      const next: 0 | 1 =
        (e.translationY < -SNAP_THRESHOLD || e.velocityY < -VELOCITY_THRESHOLD) ? 1 : 0;
      const target = next === 0 ? 0 : -SCREEN_H;
      offset.value = withSpring(target, { damping: 28, stiffness: 85, mass: 1.4 });
      curPage.value = next;
      runOnJS(setPage)(next);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  // ── Back to Page 1 (called from button) ────────────────────────
  const goToPage1 = () => {
    offset.value = withSpring(0, { damping: 28, stiffness: 85, mass: 1.4 });
    curPage.value = 0;
    setPage(0);
  };

  // ── Dismiss chat when transitioning to Page 2 ──────────────────
  useEffect(() => {
    if (page === 1) {
      setChat((prev) => prev.visible ? { ...prev, visible: false } : prev);
    }
  }, [page]);

  // ── Staleness guard ─────────────────────────────────────────────
  // ── Data fetching ───────────────────────────────────────────────
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
    fetchTasks(userId).catch(() => {});
  }, [userId, fetchTasks]);

  // Reset chat when user swipes to a different pet
  useEffect(() => {
    setChat({ visible: false, msg: '', text: '', loading: false, err: '' });
  }, [activeCarouselIndex]);

  // Sync carousel to stored active pet on mount
  useEffect(() => {
    if (!activePet?.name) return;
    const idx = UNLOCKED_DEFS.findIndex(
      (p) => p.name.toLowerCase() === activePet.name.toLowerCase(),
    );
    if (idx >= 0) setActiveCarouselIndex(idx);
  }, [activePet?.name]);

  // ── Derived ─────────────────────────────────────────────────────
  const displayName     = userName ?? userEmail?.split('@')[0] ?? 'there';
  const activePetDef    = UNLOCKED_DEFS[activeCarouselIndex] ?? UNLOCKED_DEFS[0];
  const activePetRecord = storePool.find(
    (p) => p.name.toLowerCase() === activePetDef?.id,
  ) ?? storePool[0];

  const pendingTasks  = tasks.filter((t) => t.status === 'pending');
  const deadlineTasks = pendingTasks.filter((t) => (t.category ?? 'task') === 'task');
  const dailyTasks    = pendingTasks.filter((t) => (t.category ?? 'task') === 'daily');

  // ── Handlers ────────────────────────────────────────────────────
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

  const openHomeTaskModal = useCallback((category: TaskCategory) => {
    play('tap');
    setAddTaskCategory(category);
  }, [play]);

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    const idx     = Math.max(0, Math.min(UNLOCKED_DEFS.length - 1, Math.round(xOffset / PET_CARD_W)));
    setActiveCarouselIndex(idx);
    const def    = UNLOCKED_DEFS[idx];
    const record = storePool.find((p) => p.name.toLowerCase() === def?.id) ?? storePool[0];
    if (record?.id) usePetStore.getState().setActivePet(record.id);
    // Smooth-scroll to guarantee perfect horizontal centre after momentum ends
    carouselRef.current?.scrollTo({ x: idx * PET_CARD_W, animated: true });
  };

  // Tap pet → show random greeting (no keyboard)
  const handlePetPress = useCallback((petId: string) => {
    play('tap');
    const pool = PET_GREETINGS[petId] ?? PET_GREETINGS.sunion;
    setChat((prev) => ({
      ...prev,
      visible: true,
      msg: pool[Math.floor(Math.random() * pool.length)],
      text: '',
      loading: false,
    }));
  }, [play]);

  // "···" button → show greeting + open keyboard immediately
  const handleChatBtnPress = useCallback(() => {
    play('tap');
    const pool = PET_GREETINGS[activePetDef.id] ?? PET_GREETINGS.sunion;
    setChat({
      visible: true,
      msg: pool[Math.floor(Math.random() * pool.length)],
      text: '',
      loading: false,
      err: '',
    });
    setTimeout(() => chatInputRef.current?.focus(), 50);
  }, [play, activePetDef]);

  // Keyboard send → call Chat API with the current pet's system prompt
  const handleChatSubmit = useCallback(async () => {
    const text = chat.text.trim();
    if (!text || chat.loading) return;
    setChat((p) => ({ ...p, text: '', loading: true, err: '' }));
    try {
      const reply = await chatWithPet(activePetDef.id, text);
      setChat((p) => ({ ...p, msg: reply, loading: false }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'error';
      const friendly =
        msg === 'rate_limited' ? '請稍等一下再聊～' :
        msg === 'Not authenticated' ? '請先登入再和我說話！' :
        '嗚…我現在說不出話來 (´；ω；`)';
      setChat((p) => ({ ...p, loading: false, err: friendly }));
    }
  }, [chat.text, chat.loading, activePetDef]);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[styles.pageStack, animStyle]}>

          {/* ═══════════════ PAGE 1: light cover ═══════════════════ */}
          <View style={styles.page1}>

            {/* Hero section: FocoBar + headline + CTA button */}
            <View style={styles.heroSection}>
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

            {/* Pet carousel */}
            <View style={styles.petSection}>
              <Animated.ScrollView
                ref={carouselRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.petRow,
                  { paddingHorizontal: (SCREEN_W - PET_CARD_W) / 2 },
                ]}
                decelerationRate={0.985}
                snapToInterval={PET_CARD_W}
                snapToAlignment="center"
                disableIntervalMomentum
                scrollEventThrottle={8}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true },
                )}
                onMomentumScrollEnd={handleCarouselScroll}
              >
                {UNLOCKED_DEFS.map((def, i) => {
                  const c = i * PET_CARD_W;
                  const T = PET_CARD_W * 0.20;
                  const scale = scrollX.interpolate({
                    inputRange:  [c - PET_CARD_W, c - T, c, c + T, c + PET_CARD_W],
                    outputRange: [0.65, 1.0, 1.0, 1.0, 0.65],
                    extrapolate: 'clamp',
                  });
                  const opacity = scrollX.interpolate({
                    inputRange:  [c - PET_CARD_W, c - T, c, c + T, c + PET_CARD_W],
                    outputRange: [0.40, 1.0, 1.0, 1.0, 0.40],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View
                      key={def.id}
                      style={[styles.petCard, { width: PET_CARD_W, transform: [{ scale }], opacity }]}
                    >
                      <TouchableOpacity
                        style={styles.petCardInner}
                        onPress={() => handlePetPress(def.id)}
                        onLongPress={() => {
                          play('transition_up');
                          router.push({ pathname: '/(app)/pet-info', params: { petId: def.id } });
                        }}
                        delayLongPress={500}
                        activeOpacity={0.9}
                      >
                        <PetRenderer pet={def} size={460} interactive={false} />
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>

              {/* ── Chat overlay — pure text, no bg/border ─── */}
              {chat.visible && (
                <View style={styles.chatOverlay} pointerEvents="box-none">
                  <Text style={styles.chatReplyText}>
                    {chat.loading ? '···' : chat.err ? chat.err : chat.msg}
                  </Text>
                  <TextInput
                    ref={chatInputRef}
                    style={styles.chatInputText}
                    value={chat.text}
                    onChangeText={(t) => setChat((p) => ({ ...p, text: t }))}
                    placeholder="say something…"
                    placeholderTextColor="rgba(26,22,34,0.35)"
                    returnKeyType="send"
                    multiline={false}
                    onSubmitEditing={handleChatSubmit}
                    pointerEvents="auto"
                  />
                </View>
              )}

              {/* ── Always-visible pink "···" chat button ──── */}
              <TouchableOpacity
                style={styles.chatDotBtn}
                onPress={handleChatBtnPress}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.chatDotIcon}>···</Text>
              </TouchableOpacity>
            </View>

          </View>{/* /PAGE 1 */}

          {/* ═══════════════ PAGE 2: light dashboard ═══════════════ */}
          <View style={styles.page2}>

            {/* Page 2 top bar: ↑ back + FOCO wordmark + avatar */}
            <View style={styles.page2Bar}>
              <TouchableOpacity
                style={styles.page2BarBtn}
                onPress={goToPage1}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.page2BarBtnIcon}>↑</Text>
              </TouchableOpacity>
              <Text style={styles.page2BarWordmark}>FOCO</Text>
              <TouchableOpacity
                style={styles.page2BarAvatar}
                onPress={() => { play('tap'); router.push('/(app)/settings'); }}
                activeOpacity={0.75}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.page2BarAvatarImg} />
                ) : (
                  <Text style={styles.page2BarAvatarText}>
                    {displayName[0]?.toUpperCase() ?? '?'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <Reanimated.ScrollView
              style={styles.page2Scroll}
              contentContainerStyle={styles.page2Content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Home tab: Dashboard ─────────────────────── */}
              {activePage2Tab === 'home' && (
                <>
                  <Text style={styles.greetName}>Hi {displayName},</Text>
                  <Text style={styles.greetSub}>welcome to the headspace.</Text>

                  {/* Stats preview row */}
                  <View style={styles.statsRow}>
                    {[
                      { val: '—', lbl: 'sessions\nthis week' },
                      { val: '—', lbl: 'focus time\ntoday' },
                      { val: '—', lbl: 'streak\ndays' },
                    ].map((item) => (
                      <View key={item.lbl} style={styles.statsTile}>
                        <Text style={styles.statsTileVal}>{item.val}</Text>
                        <Text style={styles.statsTileLbl}>{item.lbl}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Daily tasks preview */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabelInHeader}>daily tasks</Text>
                    <TouchableOpacity
                      style={styles.addTaskBtn}
                      onPress={() => openHomeTaskModal('daily')}
                      activeOpacity={0.75}
                    >
                      <Plus size={16} color="#ffffff" strokeWidth={2.8} />
                    </TouchableOpacity>
                  </View>
                  {dailyTasks.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.taskRow}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {dailyTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onPress={() => goFocus(task)} />
                      ))}
                    </ScrollView>
                  )}

                  {/* Deadline tasks preview */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabelInHeader}>deadlines</Text>
                    <TouchableOpacity
                      style={styles.addTaskBtn}
                      onPress={() => openHomeTaskModal('task')}
                      activeOpacity={0.75}
                    >
                      <Plus size={16} color="#ffffff" strokeWidth={2.8} />
                    </TouchableOpacity>
                  </View>
                  {deadlineTasks.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.taskRow}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {deadlineTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onPress={() => goFocus(task)} />
                      ))}
                    </ScrollView>
                  )}

                  {dailyTasks.length === 0 && deadlineTasks.length === 0 && (
                    <Text style={styles.emptyTasks}>No pending tasks — you're all clear 🎉</Text>
                  )}

                  {/* Timer */}
                  <Text style={styles.sectionLabel}>timer</Text>
                  <TimerGauge value={durationMin} onChange={setDurationMin} />
                </>
              )}

            </Reanimated.ScrollView>

            {/* Tab bar lives INSIDE the dark card — slides with it.
                Home stays inline; Tasks + Stats navigate to the real pink screens. */}
            <EmbeddedTabBar
              active={activePage2Tab}
              onPress={(tab) => {
                if (tab === 'tasks') {
                  router.push('/(app)/missions' as any);
                } else if (tab === 'stats') {
                  router.push('/(app)/stats' as any);
                } else {
                  setActivePage2Tab(tab);
                }
              }}
            />
          </View>{/* /PAGE 2 */}

        </Reanimated.View>
      </GestureDetector>

      <AddTaskModal
        visible={addTaskCategory !== null}
        category={addTaskCategory ?? 'task'}
        defaultDurationMin={durationMin}
        userId={userId}
        onClose={() => setAddTaskCategory(null)}
        onCreated={(task) => {
          const category = addTaskCategory ?? 'task';
          addTask({ ...task, category });
          setAddTaskCategory(null);
        }}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    overflow: 'hidden',
  },

  // The animated stack that translateY moves
  pageStack: {
    width: SCREEN_W,
  },

  // ── PAGE 1 ──────────────────────────────────────────────────────
  page1: {
    height: SCREEN_H,
    backgroundColor: LIGHT_BG,
  },

  // Top half of page 1: FocoBar pinned at top (safe area handled by FocoBar itself),
  // hero text sits below it with enough margin so it never overlaps the pet.
  heroSection: {
    height: HERO_SECTION_H,
    backgroundColor: LIGHT_BG,
    // removed justifyContent:'flex-end' — FocoBar now naturally stays at the top
  },
  heroArea: {
    paddingHorizontal: 38,
    paddingTop: 8,
    paddingBottom: 20,
  },
  heroLine: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 34,          // reduced 39 → 34pt (-5pt) to clear space from the pet
    fontWeight: '600',
    color: INK,
    letterSpacing: 1,
    lineHeight: 40,
  },
  pinkCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111111',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  pinkCircleArrow: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '300',
    letterSpacing: 1,
  },

  // Bottom half of page 1: pet carousel
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
  petCardInner: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },

  // Chat overlay — top-left, pure text, no bg/border
  chatOverlay: {
    position: 'absolute',
    top: 18,
    left: 22,
    maxWidth: SCREEN_W * 0.60,
    zIndex: 30,
  },
  chatReplyText: {
    color: '#1A1622',        // exact spec: #1A1622
    fontSize: 12,            // reduced from 15 → 12pt per spec
    fontFamily: 'Fraunces_500Medium',
    fontWeight: '500',
    backgroundColor: 'transparent',
    lineHeight: 17,
    marginBottom: 6,
  },
  chatInputText: {
    color: INK,
    fontSize: 14,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    minWidth: 80,
    lineHeight: 18,
  },
  chatDotBtn: {
    position: 'absolute',
    bottom: 28,
    right: 22,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    shadowColor: '#c07090',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 8,
    elevation: 4,
  },
  chatDotIcon: {
    color: INK,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
    lineHeight: 20,
  },

  // ── PAGE 2 ──────────────────────────────────────────────────────
  // Exactly SCREEN_H; EmbeddedTabBar is absolute-positioned inside.
  page2: {
    height: SCREEN_H,
    backgroundColor: DARK_BG,
    borderTopLeftRadius:  40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  page2Scroll: {
    flex: 1,
    backgroundColor: DARK_BG,   // prevents white flash on iOS over-scroll bounce
  },
  page2Content: {
    paddingTop: 16,
    paddingHorizontal: 29,
    paddingBottom: EMBEDDED_TAB_RESERVED,
  },

  greetName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 40,
    fontWeight: '600',
    color: INK,
    letterSpacing: -0.4,
    lineHeight: 44,
    marginBottom: 6,
  },
  greetSub: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(26,22,34,0.50)',
    letterSpacing: -0.2,
    marginBottom: 22,
  },

  // Stats preview tiles
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  statsTile: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#E6E6E6',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
    minHeight: 72,
  },
  statsTileVal: {
    fontSize: 22,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.5,
  },
  statsTileLbl: {
    fontSize: 10,
    color: 'rgba(26,22,34,0.50)',
    textAlign: 'center',
    lineHeight: 13,
  },

  sectionLabel: {
    fontSize: 13,
    color: 'rgba(26,22,34,0.55)',
    letterSpacing: 0.2,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  sectionLabelInHeader: {
    fontSize: 13,
    color: 'rgba(26,22,34,0.55)',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  addTaskBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },


  taskRow: {
    gap: 12,
    paddingRight: 4,
  },

  emptyTasks: {
    color: 'rgba(26,22,34,0.40)',
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
  },

  viewAllBtn: {
    marginTop: 24,
    alignSelf: 'flex-start',
  },
  viewAllText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // ── Page 2 top bar (replaces absolute back button) ───────────
  page2Bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    height: 56,
    flexShrink: 0,
  },
  page2BarWordmark: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 6,
    color: INK,
    paddingLeft: 6,
  },
  page2BarBtn: {
    position: 'absolute',
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  page2BarBtnIcon: {
    fontSize: 16,
    color: INK,
    fontWeight: '600',
    lineHeight: 18,
  },
  page2BarAvatar: {
    position: 'absolute',
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#c4b5d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  page2BarAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  page2BarAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});
