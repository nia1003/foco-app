import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
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
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useSound } from '@/components/SoundProvider';
import { FocoBar } from '@/components/layout/FocoBar';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { TimerGauge } from '@/components/home/TimerGauge';
import { AddTaskModal } from '@/components/tasks/AddTaskModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTaskStore } from '@/stores/taskStore';
import { chatWithPet, getPets, deleteTask } from '@/services/focoService';
import type { Task, TaskCategory } from '@/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PET_CARD_W     = SCREEN_W;
const PET_SECTION_H = 440;
const HERO_SECTION_H = SCREEN_H - PET_SECTION_H; 
const EMBEDDED_TAB_RESERVED = 140;

const LIGHT_BG = '#EFE8E0';
const DARK_BG  = 'rgba(255,255,255,0.98)';
const PINK     = '#ffc8ef';
const INK      = '#1a1622';

const UNLOCKED_DEFS = PETS.filter((p) => !p.locked);

const sunionIdx = UNLOCKED_DEFS.findIndex(p => p.id === 'sunion');
const INITIAL_IDX = sunionIdx >= 0 ? sunionIdx : 0;

type Page2Tab = 'home' | 'tasks' | 'stats';

function TaskCard({ task, onPress, onEdit, onDelete }: { task: Task; onPress: () => void; onEdit: () => void; onDelete: () => void; }) {
  const handleMenu = () => {
    Alert.alert(task.title, undefined, [
      { text: 'Edit', onPress: onEdit },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  return (
    <View style={taskStyles.card}>
      <TouchableOpacity style={taskStyles.menuBtn} onPress={handleMenu} activeOpacity={0.6} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Text style={taskStyles.menuDots}>⋮</Text>
      </TouchableOpacity>
      <Text style={taskStyles.title} numberOfLines={2}>{task.title}</Text>
      <TouchableOpacity style={taskStyles.btn} onPress={onPress} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={taskStyles.arrow}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const taskStyles = StyleSheet.create({
  card: { width: 137, height: 135, borderRadius: 16, backgroundColor: '#E6E6E6', paddingHorizontal: 18, paddingVertical: 16, justifyContent: 'space-between', alignItems: 'flex-start' },
  menuBtn: { position: 'absolute', top: 10, right: 12, padding: 4 },
  menuDots: { fontSize: 18, color: 'rgba(26,22,34,0.45)', fontWeight: '700', lineHeight: 20 },
  title: { fontSize: 12, fontWeight: '600', color: INK, lineHeight: 16, alignSelf: 'flex-start', marginTop: 18 },
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 16, color: '#ffffff', fontWeight: '700', letterSpacing: 2 },
});

interface EmbeddedTabBarProps { active: Page2Tab; onPress: (tab: Page2Tab) => void; }
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
            <TouchableOpacity key={tab.id} style={etbStyles.tab} onPress={() => onPress(tab.id)} activeOpacity={0.7}>
              {isActive && <View style={etbStyles.activeHighlight} />}
              <Text style={[etbStyles.icon, isActive && etbStyles.iconActive]}>{tab.icon}</Text>
              <Text style={[etbStyles.label, isActive && etbStyles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const etbStyles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 22, left: 14, right: 14, zIndex: 30 },
  pill: { flexDirection: 'row', borderRadius: 9999, borderWidth: 0.5, borderColor: 'rgba(26,22,34,0.10)', backgroundColor: 'rgba(230,230,230,0.85)', padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6, position: 'relative' },
  activeHighlight: { position: 'absolute', top: 2, bottom: 2, left: 8, right: 8, borderRadius: 9999, backgroundColor: 'rgba(155,89,208,0.15)', borderWidth: 0.5, borderColor: 'rgba(155,89,208,0.28)' },
  icon: { fontSize: 16, color: 'rgba(26,22,34,0.35)' },
  iconActive: { color: '#9B59D0' },
  label: { fontSize: 10.5, letterSpacing: 0.1, color: 'rgba(26,22,34,0.40)', fontWeight: '500' },
  labelActive: { color: '#9B59D0', fontWeight: '600' },
});

export default function HomeScreen() {
  const router   = useRouter();
  const { play } = useSound();
  const isFocused = useIsFocused();
  
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, restoreActivePet, petsLastFetchedAt } = usePetStore();
  const { tasks, addTask, removeTask, fetchTasks } = useTaskStore();
  const avatarUri = usePreferencesStore((s) => s.avatarUri);

  const [durationMin, setDurationMin]                 = useState(25);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(INITIAL_IDX);
  const [activePage2Tab, setActivePage2Tab]           = useState<Page2Tab>('home');
  const [addTaskCategory, setAddTaskCategory]         = useState<TaskCategory | null>(null);
  const [page2ScrollEnabled, setPage2ScrollEnabled]   = useState(true);
  const [editTaskId, setEditTaskId]                   = useState<string | null>(null);

  const carouselRef = useRef<any>(null);
  const hasInitiallyScrolled = useRef(false);

  const [chat, setChat] = useState<{ visible: boolean; msg: string; text: string; loading: boolean; err: string }>({ visible: false, msg: '', text: '', loading: false, err: '' });
  const chatInputRef = useRef<TextInput>(null);
  const scrollX = useRef(new Animated.Value(INITIAL_IDX * PET_CARD_W)).current;

  const offset   = useSharedValue(0);
  const curPage  = useSharedValue<0 | 1>(0); 
  const [page, setPage] = useState<0 | 1>(0);

  const SNAP_THRESHOLD     = SCREEN_H * 0.28;
  const VELOCITY_THRESHOLD = 600;
  const RESISTANCE = 0.12;

  const panGesture = Gesture.Pan()
    .activeOffsetY([-14, 14])
    .failOffsetX([-22, 22])
    .onUpdate((e) => {
      if (curPage.value === 1) return;
      const candidate = e.translationY;
      if (candidate > 0) offset.value = candidate * RESISTANCE;
      else if (candidate < -SCREEN_H) offset.value = -SCREEN_H + (candidate + SCREEN_H) * RESISTANCE;
      else offset.value = candidate;
    })
    .onEnd((e) => {
      if (curPage.value === 1) return;
      const next: 0 | 1 = (e.translationY < -SNAP_THRESHOLD || e.velocityY < -VELOCITY_THRESHOLD) ? 1 : 0;
      const target = next === 0 ? 0 : -SCREEN_H;
      offset.value = withSpring(target, { damping: 28, stiffness: 85, mass: 1.4 });
      curPage.value = next;
      runOnJS(setPage)(next);
    });

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));
  const goToPage1 = () => { offset.value = withSpring(0, { damping: 28, stiffness: 85, mass: 1.4 }); curPage.value = 0; setPage(0); };

  useEffect(() => { if (page === 1) setChat((prev) => prev.visible ? { ...prev, visible: false } : prev); }, [page]);

  useEffect(() => {
    if (!userId) return;
    const STALE_MS = 5 * 60 * 1000;
    const isStale  = !petsLastFetchedAt || Date.now() - petsLastFetchedAt > STALE_MS;
    if (pets.length && !isStale) { restoreActivePet(); return; }
    getPets(userId).then((fetched) => { setPets(fetched); restoreActivePet(); }).catch(() => {});
  }, [userId]);

  useEffect(() => { fetchTasks(userId).catch(() => {}); }, [userId, fetchTasks]);

  useEffect(() => { setChat({ visible: false, msg: '', text: '', loading: false, err: '' }); }, [activeCarouselIndex]);

  useEffect(() => {
    if (!carouselRef.current || hasInitiallyScrolled.current) return;

    let targetName = 'sunion'; 
    if (activePet?.name) {
      targetName = activePet.name.toLowerCase();
    } else if (activePet?.id) {
      targetName = activePet.id.toLowerCase();
    }

    let idx = UNLOCKED_DEFS.findIndex(p => p.id.toLowerCase() === targetName || p.name.toLowerCase() === targetName);
    if (idx < 0) idx = INITIAL_IDX;

    setActiveCarouselIndex(idx);
    setTimeout(() => {
      carouselRef.current?.scrollTo({ x: idx * PET_CARD_W, animated: false });
      hasInitiallyScrolled.current = true;
    }, 100);
  }, [activePet]); 

  const displayName   = userName ?? userEmail?.split('@')[0] ?? 'there';
  const activePetDef  = UNLOCKED_DEFS[activeCarouselIndex] ?? UNLOCKED_DEFS[INITIAL_IDX];

  const pendingTasks  = tasks.filter((t) => t.status === 'pending');
  const deadlineTasks = pendingTasks.filter((t) => (t.category ?? 'task') === 'task');
  const dailyTasks    = pendingTasks.filter((t) => (t.category ?? 'task') === 'daily');

  const goFocus = (task?: Task) => {
    const launchPetId = activePetDef.id; 
    play('transition_up');
    router.push({
      pathname: '/(app)/focus',
      params: {
        durationMin: String(durationMin),
        petId: launchPetId,
        ...(task?.id ? { taskId: task.id } : {}),
        ...(task ? { taskTitle: task.title } : {}),
      },
    });
  };

  const openHomeTaskModal = useCallback((category: TaskCategory) => { play('tap'); setAddTaskCategory(category); }, [play]);

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    const idx = Math.max(0, Math.min(UNLOCKED_DEFS.length - 1, Math.round(xOffset / PET_CARD_W)));
    if (idx !== activeCarouselIndex) {
      setActiveCarouselIndex(idx);
      usePetStore.getState().setActivePet(UNLOCKED_DEFS[idx].id);
    }
  }, [activeCarouselIndex]);

  const handlePetPress = useCallback((_petId: string) => {
    play('tap');
    setChat((prev) => ({ ...prev, visible: true, msg: '', text: '', loading: false }));
    setTimeout(() => chatInputRef.current?.focus(), 50);
  }, [play]);

  const handleChatBtnPress = useCallback(() => {
    play('tap');
    setChat({ visible: true, msg: '', text: '', loading: false, err: '' });
    setTimeout(() => chatInputRef.current?.focus(), 50);
  }, [play]);

  const handleChatSubmit = useCallback(async () => {
    const text = chat.text.trim();
    if (!text || chat.loading) return;
    setChat((p) => ({ ...p, text: '', loading: true, err: '' }));
    try {
      const reply = await chatWithPet(activePetDef.id, text);
      setChat((p) => ({ ...p, msg: reply, loading: false }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const display = msg === 'rate_limited' ? 'Too many messages — wait a moment' : msg;
      setChat((p) => ({ ...p, msg: '', loading: false, err: display }));
    }
  }, [chat.text, chat.loading, activePetDef]);

  const confirmDeleteTask = useCallback((task: Task) => {
    Alert.alert('Delete task', `Delete "${task.title}"?\nFocus sessions will stay in history.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { removeTask(task.id); deleteTask(task.id).catch(() => Alert.alert('Delete failed', 'Network error.')); } },
    ]);
  }, [removeTask]);

  return (
    <View style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <Reanimated.View style={[styles.pageStack, animStyle]}>
          <View style={styles.page1}>
            <View style={styles.heroSection}>
              <FocoBar avatar={displayName[0]?.toUpperCase() ?? '?'} />
              <View style={styles.heroArea}>
                <Text style={styles.heroLine}>{'Welcome\nback\nStart Focus.'}</Text>
              </View>
              <TouchableOpacity style={styles.pinkCircleBtn} onPress={() => { play('tap'); goFocus(); }} activeOpacity={0.8}>
                <Text style={styles.pinkCircleArrow}>→</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.petSection}>
              <Animated.ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.petRow}
                scrollEventThrottle={16}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
                onMomentumScrollEnd={handleScrollEnd}
              >
                {UNLOCKED_DEFS.map((def, i) => {
                  const c = i * PET_CARD_W;
                  const scale = scrollX.interpolate({
                    inputRange:  [c - PET_CARD_W, c, c + PET_CARD_W],
                    outputRange: [0.65, 1.0, 0.65], extrapolate: 'clamp',
                  });
                  const opacity = scrollX.interpolate({
                    inputRange:  [c - PET_CARD_W, c, c + PET_CARD_W],
                    outputRange: [0.40, 1.0, 0.40], extrapolate: 'clamp',
                  });

                  // 強化比對邏輯，確保能精準抓到資料庫中該寵物的等級
                  const dbPet = pets.find((p) => {
                    const dbId = p.id?.toLowerCase() || '';
                    const dbName = p.name?.toLowerCase() || '';
                    const targetId = def.id.toLowerCase();
                    const targetName = def.name.toLowerCase();
                    return dbId === targetId || dbId === targetName || dbName === targetId || dbName === targetName;
                  });
                  const petLevel = dbPet?.level ?? 1;

                  return (
                    <Animated.View key={def.id} style={[styles.petCard, { width: PET_CARD_W, transform: [{ scale }], opacity }]}>
                      <TouchableOpacity
                        style={styles.petCardInner}
                        onPress={() => handlePetPress(def.id)}
                        onLongPress={() => { play('transition_up'); router.push({ pathname: '/(app)/pet-info', params: { petId: def.id } }); }}
                        delayLongPress={500}
                        activeOpacity={0.9}
                      >
                        {isFocused && <PetRenderer pet={def} size={460} interactive={false} level={petLevel} />}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>

              {chat.visible && (
                <View style={styles.chatOverlay} pointerEvents="box-none">
                  {(chat.loading || chat.msg || chat.err) ? <Text style={styles.chatReplyText}>{chat.loading ? '···' : chat.err ? chat.err : chat.msg}</Text> : null}
                  <TextInput ref={chatInputRef} style={styles.chatInputText} value={chat.text} onChangeText={(t) => setChat((p) => ({ ...p, text: t }))} placeholder="say something…" placeholderTextColor="rgba(26,22,34,0.35)" returnKeyType="send" onSubmitEditing={handleChatSubmit} pointerEvents="auto" />
                </View>
              )}
              <TouchableOpacity style={styles.chatDotBtn} onPress={handleChatBtnPress} activeOpacity={0.75} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.chatDotIcon}>···</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.page2}>
            <FocoBar back backUp onBack={goToPage1} avatar={displayName[0]?.toUpperCase() ?? '?'} avatarUri={avatarUri} />
            <Reanimated.ScrollView style={styles.page2Scroll} contentContainerStyle={styles.page2Content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEnabled={page2ScrollEnabled}>
              {activePage2Tab === 'home' && (
                <>
                  <Text style={styles.greetName}>Hi {displayName},</Text>
                  <Text style={styles.greetSub}>welcome to the headspace.</Text>
                  <View style={styles.statsRow}>
                    {[{ val: '—', lbl: 'sessions\nthis week' }, { val: '—', lbl: 'focus time\ntoday' }, { val: '—', lbl: 'streak\ndays' }].map((item) => (
                      <View key={item.lbl} style={styles.statsTile}>
                        <Text style={styles.statsTileVal}>{item.val}</Text>
                        <Text style={styles.statsTileLbl}>{item.lbl}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabelInHeader}>daily tasks</Text>
                    <TouchableOpacity style={styles.addTaskBtn} onPress={() => openHomeTaskModal('daily')} activeOpacity={0.75}>
                      <Plus size={16} color="#ffffff" strokeWidth={2.8} />
                    </TouchableOpacity>
                  </View>
                  {dailyTasks.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taskRow} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {dailyTasks.map((task) => <TaskCard key={task.id} task={task} onPress={() => goFocus(task)} onEdit={() => setEditTaskId(task.id)} onDelete={() => confirmDeleteTask(task)} />)}
                    </ScrollView>
                  )}

                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabelInHeader}>deadlines</Text>
                    <TouchableOpacity style={styles.addTaskBtn} onPress={() => openHomeTaskModal('task')} activeOpacity={0.75}>
                      <Plus size={16} color="#ffffff" strokeWidth={2.8} />
                    </TouchableOpacity>
                  </View>
                  {deadlineTasks.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taskRow} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {deadlineTasks.map((task) => <TaskCard key={task.id} task={task} onPress={() => goFocus(task)} onEdit={() => setEditTaskId(task.id)} onDelete={() => confirmDeleteTask(task)} />)}
                    </ScrollView>
                  )}

                  {dailyTasks.length === 0 && deadlineTasks.length === 0 && <Text style={styles.emptyTasks}>No pending tasks — you're all clear</Text>}

                  <Text style={styles.sectionLabel}>timer</Text>
                  <TimerGauge value={durationMin} onChange={setDurationMin} onDragStart={() => setPage2ScrollEnabled(false)} onDragEnd={() => setPage2ScrollEnabled(true)} />
                </>
              )}
            </Reanimated.ScrollView>
            <EmbeddedTabBar active={activePage2Tab} onPress={(tab) => { if (tab === 'tasks') { router.push('/(app)/missions' as any); } else if (tab === 'stats') { router.push('/(app)/stats' as any); } else { setActivePage2Tab(tab); } }} />
          </View>
        </Reanimated.View>
      </GestureDetector>

      <AddTaskModal visible={addTaskCategory !== null} category={addTaskCategory ?? 'task'} defaultDurationMin={durationMin} userId={userId} onClose={() => setAddTaskCategory(null)} onCreated={(task) => { const category = addTaskCategory ?? 'task'; addTask({ ...task, category }); setAddTaskCategory(null); }} />
      <TaskDetailModal visible={editTaskId !== null} taskId={editTaskId} onClose={() => setEditTaskId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG, overflow: 'hidden' },
  pageStack: { width: SCREEN_W },
  page1: { height: SCREEN_H, backgroundColor: LIGHT_BG },
  heroSection: { height: HERO_SECTION_H, backgroundColor: LIGHT_BG },
  heroArea: { paddingHorizontal: 38, paddingTop: 8, paddingBottom: 20 },
  heroLine: { fontFamily: 'Fraunces_500Medium', fontSize: 34, fontWeight: '600', color: INK, letterSpacing: 1, lineHeight: 40 },
  pinkCircleBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#111111', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
  pinkCircleArrow: { fontSize: 18, color: '#ffffff', fontWeight: '300', letterSpacing: 1 },
  petSection: { height: PET_SECTION_H, backgroundColor: 'transparent', zIndex: 20 },
  petRow:  { gap: 0 },
  petCard: { height: PET_SECTION_H, alignItems: 'center', justifyContent: 'flex-end' },
  petCardInner: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 50 },
  chatOverlay: { position: 'absolute', top: 18, left: 22, maxWidth: SCREEN_W * 0.60, zIndex: 30 },
  chatReplyText: { color: '#1A1622', fontSize: 12, fontFamily: 'Fraunces_500Medium', fontWeight: '500', backgroundColor: 'transparent', lineHeight: 17, marginBottom: 6 },
  chatInputText: { color: INK, fontSize: 14, backgroundColor: 'transparent', borderWidth: 0, padding: 0, minWidth: 80, lineHeight: 18 },
  chatDotBtn: { position: 'absolute', bottom: 28, right: 22, width: 46, height: 46, borderRadius: 23, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center', zIndex: 35, shadowColor: '#c07090', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.20, shadowRadius: 8, elevation: 4 },
  chatDotIcon: { color: INK, fontSize: 17, fontWeight: '700', letterSpacing: 2, lineHeight: 20 },
  page2: { height: SCREEN_H, backgroundColor: DARK_BG, borderTopLeftRadius:  40, borderTopRightRadius: 40, overflow: 'hidden', position: 'relative' },
  page2Scroll: { flex: 1, backgroundColor: DARK_BG },
  page2Content: { paddingTop: 16, paddingHorizontal: 29, paddingBottom: EMBEDDED_TAB_RESERVED },
  greetName: { fontFamily: 'Fraunces_500Medium', fontSize: 40, fontWeight: '600', color: INK, letterSpacing: -0.4, lineHeight: 44, marginBottom: 6 },
  greetSub: { fontFamily: 'Fraunces_500Medium', fontSize: 18, fontWeight: '600', color: 'rgba(26,22,34,0.50)', letterSpacing: -0.2, marginBottom: 22 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  statsTile: { flex: 1, borderRadius: 16, backgroundColor: '#E6E6E6', paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', gap: 4, minHeight: 72 },
  statsTileVal: { fontSize: 22, fontWeight: '700', color: INK, letterSpacing: -0.5 },
  statsTileLbl: { fontSize: 10, color: 'rgba(26,22,34,0.50)', textAlign: 'center', lineHeight: 13 },
  sectionLabel: { fontSize: 13, color: 'rgba(26,22,34,0.55)', letterSpacing: 0.2, marginTop: 24, marginBottom: 12 },
  sectionHeader: { marginTop: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10 },
  sectionLabelInHeader: { fontSize: 13, color: 'rgba(26,22,34,0.55)', letterSpacing: 0.2, lineHeight: 18 },
  addTaskBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  taskRow: { gap: 12, paddingRight: 4 },
  emptyTasks: { color: 'rgba(26,22,34,0.40)', fontSize: 14, marginTop: 24, textAlign: 'center' },
  viewAllBtn: { marginTop: 24, alignSelf: 'flex-start' },
  viewAllText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, letterSpacing: 0.2 },
});