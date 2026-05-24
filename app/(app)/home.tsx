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
  ActivityIndicator,
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Check, Plus, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { FocoBar } from '@/components/layout/FocoBar';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { TimerGauge } from '@/components/home/TimerGauge';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { useTaskStore } from '@/stores/taskStore';
import { chatWithPet, createTask, getPets } from '@/services/focoService';
import { mockPets } from '@/data/mockData';
import type { Task } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PET_CARD_W    = Math.round(SCREEN_W * 0.72);
const PET_SECTION_H = 440;
const HERO_SECTION_H = SCREEN_H - PET_SECTION_H; // fills rest of page 1
const EMBEDDED_TAB_RESERVED = 96;

const LIGHT_BG = '#fbfbfb';
const DARK_BG  = '#252525';
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

function AddDailyTaskCard({
  value,
  error,
  loading,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: string;
  error: string | null;
  loading: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={[taskStyles.card, taskStyles.addCard]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="New daily task"
        placeholderTextColor="rgba(26,22,34,0.38)"
        style={taskStyles.addInput}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {error && <Text style={taskStyles.addError} numberOfLines={1}>{error}</Text>}
      <View style={taskStyles.addActions}>
        <TouchableOpacity
          style={[taskStyles.iconBtn, taskStyles.cancelBtn]}
          onPress={onCancel}
          activeOpacity={0.75}
          disabled={loading}
        >
          <X size={16} color={INK} strokeWidth={2.6} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[taskStyles.iconBtn, taskStyles.confirmBtn]}
          onPress={onSubmit}
          activeOpacity={0.75}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={INK} />
          ) : (
            <Check size={17} color={INK} strokeWidth={2.8} />
          )}
        </TouchableOpacity>
      </View>
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
  addCard: {
    gap: 6,
  },
  addInput: {
    width: '100%',
    minHeight: 44,
    padding: 0,
    color: INK,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  addError: {
    color: '#9d3354',
    fontSize: 10,
    lineHeight: 12,
  },
  addActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(26,22,34,0.08)',
  },
  confirmBtn: {
    backgroundColor: PINK,
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
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(37,37,37,0.88)',
    padding: 8,
    shadowColor: 'rgba(0,0,0,0.8)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
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
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  icon: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.40)',
  },
  iconActive: {
    color: '#ffffff',
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.1,
    color: 'rgba(255,255,255,0.40)',
    fontWeight: '500',
  },
  labelActive: {
    color: '#ffffff',
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

  const storePool = pets.length > 0 ? pets : mockPets;

  const [durationMin, setDurationMin]                 = useState(25);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [activePage2Tab, setActivePage2Tab]           = useState<Page2Tab>('home');
  const [isAddingDailyTask, setIsAddingDailyTask]     = useState(false);
  const [dailyTaskTitle, setDailyTaskTitle]           = useState('');
  const [dailyTaskError, setDailyTaskError]           = useState<string | null>(null);
  const [dailyTaskSaving, setDailyTaskSaving]         = useState(false);
  const [isAddingDeadlineTask, setIsAddingDeadlineTask] = useState(false);
  const [deadlineTaskTitle, setDeadlineTaskTitle]       = useState('');
  const [deadlineTaskError, setDeadlineTaskError]       = useState<string | null>(null);
  const [deadlineTaskSaving, setDeadlineTaskSaving]     = useState(false);

  // ref used for programmatic smooth-scroll to centre after snap
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const carouselRef = useRef<any>(null);

  // Pet chat state
  const [chat, setChat] = useState<{ visible: boolean; msg: string; text: string; loading: boolean }>({
    visible: false, msg: '', text: '', loading: false,
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

  // Tracks Page 2 inner scroll position; used to block pan-to-page1 when scrolled
  const page2AtTop = useSharedValue(1); // 1 = at top, 0 = scrolled down

  const page2ScrollHandler = useAnimatedScrollHandler((event) => {
    page2AtTop.value = event.contentOffset.y < 8 ? 1 : 0;
  });

  // ── Pan gesture: vertical-only, rubber-band resistance, spring snap ──
  // Page1→Page2 (swipe up): 28% threshold — easy to enter dashboard
  // Page2→Page1 (swipe down): 60% threshold — requires deliberate long drag
  const SNAP_THRESHOLD    = SCREEN_H * 0.28;
  const RETURN_THRESHOLD  = SCREEN_H * 0.60;
  const VELOCITY_THRESHOLD = 600;
  const RESISTANCE = 0.12;

  const panGesture = Gesture.Pan()
    .activeOffsetY([-14, 14])   // activate after 14px vertical
    .failOffsetX([-22, 22])     // fail if >22px horizontal (lets carousel take over)
    .onUpdate((e) => {
      const isPage2 = curPage.value === 1;
      const base = isPage2 ? -SCREEN_H : 0;
      const candidate = base + e.translationY;

      // On page 2 scrolled down: ignore upward drag (inner scroll handles it)
      if (isPage2 && e.translationY < 0 && page2AtTop.value < 0.5) return;

      // Rubber-band resistance beyond snap bounds
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
      const drag = e.translationY;
      const vel  = e.velocityY;

      let next: 0 | 1;
      if (!isPage2) {
        // On page 1: drag up enough or fast → go to page 2
        next = (drag < -SNAP_THRESHOLD || vel < -VELOCITY_THRESHOLD) ? 1 : 0;
      } else {
        // On page 2 at top: must drag down 60% of screen or very fast → back to page 1
        next = (drag > RETURN_THRESHOLD || vel > VELOCITY_THRESHOLD) ? 0 : 1;
      }

      const target = next === 0 ? 0 : -SCREEN_H;
      offset.value = withSpring(target, {
        damping: 28,
        stiffness: 85,
        mass: 1.4,
        overshootClamping: false,
      });
      curPage.value = next;
      runOnJS(setPage)(next);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  // Pink return-arrow fades in as the user drags Page 2 down toward Page 1.
  // pulled=0 when Page 2 is at rest; grows positive as user drags toward page 1.
  const page2ArrowStyle = useAnimatedStyle(() => {
    const pulled  = offset.value + SCREEN_H;                    // 0 at rest
    const opacity = Math.min(1, Math.max(0, pulled / (SCREEN_H * 0.12)));
    const translateY = -(pulled * 0.25);                        // arrow rises with drag
    return { opacity, transform: [{ translateY }] };
  });

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
    setChat({ visible: false, msg: '', text: '', loading: false });
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

  const openDailyTaskComposer = useCallback(() => {
    play('tap');
    setDailyTaskError(null);
    setIsAddingDailyTask(true);
  }, [play]);

  const cancelDailyTaskComposer = useCallback(() => {
    play('tap');
    setDailyTaskTitle('');
    setDailyTaskError(null);
    setIsAddingDailyTask(false);
  }, [play]);

  const handleCreateDailyTask = useCallback(async () => {
    const title = dailyTaskTitle.trim();
    if (!title) {
      setDailyTaskError('Add a title');
      return;
    }
    if (dailyTaskSaving) return;

    setDailyTaskSaving(true);
    setDailyTaskError(null);
    try {
      let task: Task;
      if (userId) {
        const created = await createTask(userId, title, durationMin, { category: 'daily' });
        task = {
          ...created,
          status: created.status ?? 'pending',
          category: 'daily',
          taskType: 'daily',
        };
      } else {
        task = {
          id: `local-daily-${Date.now()}`,
          user_id: 'mock-user-001',
          title,
          duration_min: durationMin,
          status: 'pending',
          category: 'daily',
          created_at: new Date().toISOString(),
          taskType: 'daily',
        };
      }

      addTask(task);
      setDailyTaskTitle('');
      setIsAddingDailyTask(false);
      play('toggle_on');
    } catch {
      setDailyTaskError('Could not save');
    } finally {
      setDailyTaskSaving(false);
    }
  }, [dailyTaskTitle, dailyTaskSaving, userId, durationMin, addTask, play]);

  const openDeadlineTaskComposer = useCallback(() => {
    play('tap');
    setDeadlineTaskError(null);
    setIsAddingDeadlineTask(true);
  }, [play]);

  const cancelDeadlineTaskComposer = useCallback(() => {
    play('tap');
    setDeadlineTaskTitle('');
    setDeadlineTaskError(null);
    setIsAddingDeadlineTask(false);
  }, [play]);

  const handleCreateDeadlineTask = useCallback(async () => {
    const title = deadlineTaskTitle.trim();
    if (!title) {
      setDeadlineTaskError('Add a title');
      return;
    }
    if (deadlineTaskSaving) return;

    setDeadlineTaskSaving(true);
    setDeadlineTaskError(null);
    try {
      let task: Task;
      if (userId) {
        const created = await createTask(userId, title, durationMin, { category: 'task' });
        task = {
          ...created,
          status: created.status ?? 'pending',
          category: 'task',
          taskType: 'deadline',
        };
      } else {
        task = {
          id: `local-deadline-${Date.now()}`,
          user_id: 'mock-user-001',
          title,
          duration_min: durationMin,
          status: 'pending',
          category: 'task',
          created_at: new Date().toISOString(),
          taskType: 'deadline',
        };
      }

      addTask(task);
      setDeadlineTaskTitle('');
      setIsAddingDeadlineTask(false);
      play('toggle_on');
    } catch {
      setDeadlineTaskError('Could not save');
    } finally {
      setDeadlineTaskSaving(false);
    }
  }, [deadlineTaskTitle, deadlineTaskSaving, userId, durationMin, addTask, play]);

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
    });
    setTimeout(() => chatInputRef.current?.focus(), 50);
  }, [play, activePetDef]);

  // Keyboard send → call Chat API with the current pet's system prompt
  const handleChatSubmit = useCallback(async () => {
    const text = chat.text.trim();
    if (!text || chat.loading) return;
    setChat((p) => ({ ...p, text: '', loading: true }));
    try {
      const reply = await chatWithPet(activePetDef.id, text);
      setChat((p) => ({ ...p, msg: reply, loading: false }));
    } catch {
      setChat((p) => ({ ...p, loading: false }));
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
                    {chat.loading ? '···' : chat.msg}
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

          {/* ═══════════════ PAGE 2: dark dashboard ════════════════ */}
          <View style={styles.page2}>

            {/* Pink return-arrow — appears as user drags Page 2 down to return to Page 1 */}
            <Reanimated.View style={[styles.page2ReturnArrow, page2ArrowStyle]} pointerEvents="none">
              <Text style={styles.page2ReturnArrowIcon}>↑</Text>
            </Reanimated.View>

            <Reanimated.ScrollView
              style={styles.page2Scroll}
              contentContainerStyle={styles.page2Content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              onScroll={page2ScrollHandler}
            >
              {/* ── Home tab: Dashboard ─────────────────────── */}
              {activePage2Tab === 'home' && (
                <>
                  <Text style={styles.greetName}>Hi {displayName},</Text>
                  <Text style={styles.greetSub}>welcome to the headspace.</Text>

                  {/* Stats preview row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statsTile}>
                      <Text style={styles.statsTileVal}>—</Text>
                      <Text style={styles.statsTileLbl}>sessions{'\n'}this week</Text>
                    </View>
                    <View style={styles.statsTile}>
                      <Text style={styles.statsTileVal}>—</Text>
                      <Text style={styles.statsTileLbl}>focus time{'\n'}today</Text>
                    </View>
                    <View style={styles.statsTile}>
                      <Text style={styles.statsTileVal}>—</Text>
                      <Text style={styles.statsTileLbl}>streak{'\n'}days</Text>
                    </View>
                  </View>

                  {/* Daily tasks preview */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabelInHeader}>daily tasks</Text>
                    <TouchableOpacity
                      style={styles.addTaskBtn}
                      onPress={openDailyTaskComposer}
                      activeOpacity={0.75}
                      disabled={isAddingDailyTask}
                    >
                      <Plus size={16} color={INK} strokeWidth={2.8} />
                    </TouchableOpacity>
                  </View>
                  {(dailyTasks.length > 0 || isAddingDailyTask) && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.taskRow}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {isAddingDailyTask && (
                        <AddDailyTaskCard
                          value={dailyTaskTitle}
                          error={dailyTaskError}
                          loading={dailyTaskSaving}
                          onChange={(value) => {
                            setDailyTaskTitle(value);
                            if (dailyTaskError) setDailyTaskError(null);
                          }}
                          onCancel={cancelDailyTaskComposer}
                          onSubmit={handleCreateDailyTask}
                        />
                      )}
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
                      onPress={openDeadlineTaskComposer}
                      activeOpacity={0.75}
                      disabled={isAddingDeadlineTask}
                    >
                      <Plus size={16} color={INK} strokeWidth={2.8} />
                    </TouchableOpacity>
                  </View>
                  {(deadlineTasks.length > 0 || isAddingDeadlineTask) && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.taskRow}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {isAddingDeadlineTask && (
                        <AddDailyTaskCard
                          value={deadlineTaskTitle}
                          error={deadlineTaskError}
                          loading={deadlineTaskSaving}
                          onChange={(value) => {
                            setDeadlineTaskTitle(value);
                            if (deadlineTaskError) setDeadlineTaskError(null);
                          }}
                          onCancel={cancelDeadlineTaskComposer}
                          onSubmit={handleCreateDeadlineTask}
                        />
                      )}
                      {deadlineTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onPress={() => goFocus(task)} />
                      ))}
                    </ScrollView>
                  )}

                  {dailyTasks.length === 0 && deadlineTasks.length === 0 && !isAddingDailyTask && !isAddingDeadlineTask && (
                    <Text style={styles.emptyTasks}>No pending tasks — you're all clear 🎉</Text>
                  )}

                  {/* Timer */}
                  <Text style={styles.sectionLabel}>timer</Text>
                  <View style={styles.gaugeCard}>
                    <TimerGauge value={durationMin} onChange={setDurationMin} />
                  </View>
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
    backgroundColor: PINK,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#c07090',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  pinkCircleArrow: {
    fontSize: 18,
    color: INK,
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
    paddingTop: 52,
    paddingHorizontal: 29,
    paddingBottom: EMBEDDED_TAB_RESERVED,
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  statsTileVal: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  statsTileLbl: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.50)',
    textAlign: 'center',
    lineHeight: 13,
  },

  sectionLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.71)',
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
    color: 'rgba(255,255,255,0.71)',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  addTaskBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.95,
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

  emptyTasks: {
    color: 'rgba(255,255,255,0.45)',
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

  // ── Pink return-arrow on Page 2 ──────────────────────────────
  page2ReturnArrow: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  page2ReturnArrowIcon: {
    fontSize: 22,
    color: PINK,
    fontWeight: '700',
    lineHeight: 26,
  },
});
