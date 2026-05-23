/**
 * HomeScreen — vertical two-page layout
 *   Page 1 (top, light, NO tab bar):  FocoBar + hero + CTA + pet carousel + chat
 *   Page 2 (bottom, dark, has tab bar): greeting/timer/tasks | tasks list | stats
 *
 * The EmbeddedTabBar lives inside the dark section view, so it physically
 * scrolls with the dark block — it is never a globally-floating element.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { chatWithPet, getPets, getTasks } from '@/services/focoService';
import { mockPets, mockTasks } from '@/data/mockData';
import type { Task } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PET_CARD_W    = Math.round(SCREEN_W * 0.72);
const PET_SECTION_H = 440;
const DARK_OVERLAP  = 55;
const EMBEDDED_TAB_RESERVED = 96; // space at bottom of page-2 content for tab bar

const LIGHT_BG = '#fbfbfb';
const DARK_BG  = '#252525';
const PINK     = '#ffc8ef';
const INK      = '#1a1622';

const UNLOCKED_DEFS = PETS.filter((p) => !p.locked);

type Page2Tab = 'home' | 'tasks' | 'stats';

// Random greetings per pet
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

// ── EmbeddedTabBar ────────────────────────────────────────────────────────────
// Physically lives inside the dark section — scrolls WITH it, never floats globally.
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

  const storePool = pets.length > 0 ? pets : mockPets;

  const [durationMin, setDurationMin]                 = useState(25);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [pendingTasks, setPendingTasks]               = useState<Task[]>([]);
  const [activePage2Tab, setActivePage2Tab]           = useState<Page2Tab>('home');

  // Pet chat state
  const [chat, setChat] = useState<{ visible: boolean; msg: string; text: string; loading: boolean }>({
    visible: false, msg: '', text: '', loading: false,
  });
  const chatInputRef = useRef<TextInput>(null);

  // Drives per-pet scale/opacity on native thread (60fps)
  const scrollX = useRef(new Animated.Value(0)).current;

  // Staleness guard for task list
  const tasksLastFetchedAt = useRef<number | null>(null);
  const TASKS_STALE_MS = 5 * 60 * 1000;

  // ── Page 1 / Page 2 scroll ─────────────────────────────────────
  const mainScrollRef   = useRef<ScrollView>(null);
  const darkSectionYRef = useRef<number>(0);

  const onDarkSectionLayout = useCallback((e: LayoutChangeEvent) => {
    darkSectionYRef.current = e.nativeEvent.layout.y;
  }, []);

  const onMainScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Dismiss pet chat when user scrolls into Page 2 area
    const y = e.nativeEvent.contentOffset.y;
    if (y > darkSectionYRef.current - 40) {
      setChat((prev) => prev.visible ? { ...prev, visible: false } : prev);
    }
  }, []);

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

  // Reset chat when the user swipes to a different pet
  useEffect(() => {
    setChat({ visible: false, msg: '', text: '', loading: false });
  }, [activeCarouselIndex]);

  // Sync carousel index to stored active pet on mount
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

  const deadlineTasks = pendingTasks.filter((t) => t.taskType === 'deadline');
  const dailyTasks    = pendingTasks.filter((t) => t.taskType === 'daily' || !t.taskType);

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

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const idx    = Math.max(0, Math.min(UNLOCKED_DEFS.length - 1, Math.round(offset / PET_CARD_W)));
    setActiveCarouselIndex(idx);
    const def    = UNLOCKED_DEFS[idx];
    const record = storePool.find((p) => p.name.toLowerCase() === def?.id) ?? storePool[0];
    if (record?.id) usePetStore.getState().setActivePet(record.id);
  };

  // Tap pet → show greeting without keyboard
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

  // "..." button → show greeting + open keyboard immediately
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

  // Keyboard send → call Chat API with current pet's personality
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
      <ScrollView
        ref={mainScrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={50}
        onScroll={onMainScroll}
      >
        {/* ── PAGE 1: LIGHT SECTION (NO TAB BAR) ─────────────── */}
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

        {/* ── PAGE 1: PET CAROUSEL ────────────────────────────── */}
        <View style={styles.petSection}>
          {/*
           * Threshold / deadzone interpolation
           * T = 20% of card width = deadzone on each side of the centred pet.
           * scale / opacity clamp: [0.65 → 1.0 → 1.0 → 1.0 → 0.65]
           * decelerationRate=0.985 gives a heavy, intentional swipe feel.
           */}
          <Animated.ScrollView
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
                  style={[
                    styles.petCard,
                    { width: PET_CARD_W, transform: [{ scale }], opacity },
                  ]}
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
                    {/* interactive=false prevents WebView from hijacking carousel scroll */}
                    <PetRenderer pet={def} size={460} interactive={false} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>

          {/* ── Pet chat overlay — pure text, no bg/border ──── */}
          {chat.visible && (
            <View style={styles.chatOverlay} pointerEvents="box-none">
              {/* Pet response / greeting text */}
              <Text style={styles.chatReplyText}>
                {chat.loading ? '···' : chat.msg}
              </Text>
              {/* Invisible input — receives keyboard input */}
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

          {/* ── Always-visible pink "···" chat button ─────── */}
          <TouchableOpacity
            style={styles.chatDotBtn}
            onPress={handleChatBtnPress}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.chatDotIcon}>···</Text>
          </TouchableOpacity>
        </View>

        {/* ── PAGE 2: DARK SECTION (HAS EMBEDDED TAB BAR) ────── */}
        {/*
         * height: SCREEN_H ensures the dark block fills the viewport exactly
         * when scrolled into view. The EmbeddedTabBar (absolute bottom) will
         * therefore sit at the screen bottom — it slides IN with the block and
         * slides OUT with it. It is never a globally-floating element.
         */}
        <View style={styles.darkSection} onLayout={onDarkSectionLayout}>
          {/* ── Sub-tab content area ──────────────────────── */}
          <View style={styles.page2Content}>
            {activePage2Tab === 'home' && (
              <>
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

                {deadlineTasks.length === 0 && dailyTasks.length === 0 && (
                  <Text style={styles.emptyTasks}>No pending tasks — you're all clear 🎉</Text>
                )}
              </>
            )}

            {activePage2Tab === 'tasks' && (
              <>
                <Text style={styles.greetName}>Tasks</Text>
                <Text style={styles.greetSub}>all pending missions.</Text>

                {pendingTasks.length === 0 ? (
                  <Text style={styles.emptyTasks}>No pending tasks — add one to get started!</Text>
                ) : (
                  <>
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
                        <Text style={styles.sectionLabel}>daily</Text>
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
                    <TouchableOpacity
                      style={styles.viewAllBtn}
                      onPress={() => router.push('/(app)/missions' as any)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.viewAllText}>View full task manager →</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {activePage2Tab === 'stats' && (
              <>
                <Text style={styles.greetName}>Stats</Text>
                <Text style={styles.greetSub}>your focus journey.</Text>
                <View style={styles.gaugeCard}>
                  <Text style={styles.statsPlaceholder}>
                    {'Sessions this week: —\nFocus time today: —'}
                  </Text>
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
          </View>

          {/* ── Embedded Tab Bar — lives INSIDE dark section ─ */}
          <EmbeddedTabBar active={activePage2Tab} onPress={setActivePage2Tab} />
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
    fontSize: 39,
    fontWeight: '600',
    color: INK,
    letterSpacing: 1,
    lineHeight: 43,
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
  petCardInner: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },

  // ── Pet chat overlay — top-left of pet section, pure text, no bg/border ──
  chatOverlay: {
    position: 'absolute',
    top: 18,
    left: 22,
    maxWidth: SCREEN_W * 0.60,
    zIndex: 30,
  },
  chatReplyText: {
    color: INK,
    fontSize: 15,
    fontFamily: 'Fraunces_500Medium',
    fontWeight: '500',
    backgroundColor: 'transparent',
    lineHeight: 20,
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
  // Always-visible pink "···" circle button
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

  // ── Dark section (Page 2) ────────────────────────────────────────
  // height: SCREEN_H means when scrolled into view the block fills the
  // entire viewport — the EmbeddedTabBar (absolute bottom: 22) lands at
  // the screen bottom and slides in/out with this block.
  darkSection: {
    backgroundColor: DARK_BG,
    borderTopLeftRadius:  40,
    borderTopRightRadius: 40,
    marginTop: -DARK_OVERLAP,
    height: SCREEN_H,
    position: 'relative',
    zIndex: 10,
  },

  // Inner content area — reserves space at the bottom for the embedded tab bar
  page2Content: {
    paddingTop: DARK_OVERLAP + 28,
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

  statsPlaceholder: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: 'center',
  },
});
