/**
 * FocusSetupSheet — 3-step bottom sheet for starting a focus session.
 *   Step 0: Task name + emoji + optional memo (or "No task")
 *   Step 1: Companion pet selection
 *   Step 2: Circular duration picker → START FOCUS
 *
 * Replaces both FocusSetupModal and the Create Task modal in Missions.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
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
import { CircularDurationPicker } from '@/components/ui/CircularDurationPicker';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { FrostCard } from '@/components/ui/FrostCard';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import { useAuthStore } from '@/stores/authStore';
import { useSound } from '@/components/SoundProvider';
import { createTask } from '@/services/focoService';
import type { FocoPet, Task } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');

const EMOJI_OPTIONS = [
  '📚', '✏️', '💻', '🎯',
  '💼', '🎨', '🎵', '🏃',
  '🔬', '🌱', '☕', '💡',
  '📝', '🎤', '🏋️', '⭐',
];

const PINK      = '#F2CEDC';
const PINK_TEXT = '#b5607a';

interface Props {
  visible: boolean;
  onClose: () => void;
  pets: FocoPet[];
  // Existing tasks the user can select (optional)
  tasks?: Task[];
  // Pre-fill options
  initialTaskId?:    string | null;
  initialTaskTitle?: string | null;
  initialDuration?:  number;
  initialPetId?:     string | null;
}

export function FocusSetupSheet({
  visible,
  onClose,
  pets,
  tasks = [],
  initialTaskId    = null,
  initialTaskTitle = null,
  initialDuration  = 25,
  initialPetId     = null,
}: Props) {
  const router   = useRouter();
  const { activePet, setActivePet } = usePetStore();
  const { userId } = useAuthStore();
  const { play }   = useSound();

  // ── Wizard state ──────────────────────────────────────
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Step 0 — task
  const [taskMode, setTaskMode] = useState<'none' | 'existing' | 'new'>('none');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newEmoji,  setNewEmoji]  = useState('📚');
  const [newTitle,  setNewTitle]  = useState('');
  const [newMemo,   setNewMemo]   = useState('');
  const [creating,  setCreating]  = useState(false);

  // Step 1 — companion
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Step 2 — duration
  const [duration, setDuration] = useState(initialDuration);

  // ── Reset on open ─────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const hasInitialTask = !!initialTaskId || !!initialTaskTitle;
    setTaskMode(hasInitialTask ? 'existing' : 'none');
    setSelectedTaskId(initialTaskId ?? null);
    setNewTitle(initialTaskTitle ?? '');
    setNewEmoji('📚');
    setNewMemo('');
    setCreating(false);
    setSelectedPetId(initialPetId ?? activePet?.id ?? pets[0]?.id ?? null);
    setDuration(initialDuration);
    goToStep(0, false);
  }, [visible]);

  // ── Navigation ────────────────────────────────────────
  function goToStep(s: number, animate = true) {
    setStep(s);
    Animated.spring(slideAnim, {
      toValue: -s * SCREEN_W,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }

  function handleNext() {
    play('tap');
    goToStep(step + 1);
  }

  function handleBack() {
    play('tap');
    goToStep(step - 1);
  }

  // ── Task helpers ──────────────────────────────────────
  function selectExistingTask(id: string) {
    setTaskMode('existing');
    setSelectedTaskId(id);
  }

  function selectNoTask() {
    setTaskMode('none');
    setSelectedTaskId(null);
  }

  function startNewTask() {
    setTaskMode('new');
    setSelectedTaskId(null);
    setNewTitle('');
  }

  // ── Start session ─────────────────────────────────────
  async function handleStart() {
    if (selectedPetId && selectedPetId !== activePet?.id) {
      await setActivePet(selectedPetId);
    }

    let taskId: string | null  = selectedTaskId;
    let taskTitle: string | undefined;

    // If user typed a new task, create it first
    if (taskMode === 'new' && newTitle.trim()) {
      try {
        setCreating(true);
        const created = await createTask(userId ?? '', newTitle.trim(), duration);
        taskId    = created.id;
        taskTitle = `${newEmoji} ${newTitle.trim()}`;
      } catch {
        Alert.alert('建立失敗', '請稍後再試');
        setCreating(false);
        return;
      } finally {
        setCreating(false);
      }
    } else if (taskMode === 'existing') {
      const t = tasks.find((x) => x.id === taskId);
      if (t) taskTitle = `${t.emoji ? t.emoji + ' ' : ''}${t.title}`;
      else if (initialTaskTitle) taskTitle = initialTaskTitle;
    }

    onClose();
    play('transition_up');
    router.push({
      pathname: '/(app)/focus',
      params: {
        durationMin: String(duration),
        petId: selectedPetId ?? '',
        ...(taskId    ? { taskId }    : {}),
        ...(taskTitle ? { taskTitle } : {}),
      },
    });
  }

  // ── Derived ───────────────────────────────────────────
  const step0Valid = taskMode !== 'new' || newTitle.trim().length > 0;
  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Step indicator */}
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
            ))}
          </View>

          {/* Sliding pages */}
          <View style={styles.overflow}>
            <Animated.View
              style={[
                styles.pagesRow,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              {/* ── STEP 0: Task ───────────────────────────── */}
              <View style={styles.page}>
                <Text style={styles.stepTitle}>What's your mission?</Text>

                {/* "No task" chip */}
                <TouchableOpacity
                  style={[styles.noTaskChip, taskMode === 'none' && styles.chipActive]}
                  onPress={() => { play('tap'); selectNoTask(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.noTaskText, taskMode === 'none' && styles.chipActiveText]}>
                    Free focus (no mission)
                  </Text>
                </TouchableOpacity>

                {/* Existing tasks */}
                {pendingTasks.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.taskChipRow}
                    style={{ marginTop: 10 }}
                  >
                    {pendingTasks.map((t) => {
                      const active = taskMode === 'existing' && selectedTaskId === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.taskChip, active && styles.chipActive]}
                          onPress={() => { play('tap'); selectExistingTask(t.id); }}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.taskChipText, active && styles.chipActiveText]} numberOfLines={1}>
                            {t.emoji ? `${t.emoji} ` : ''}{t.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* New task button / form */}
                {taskMode !== 'new' ? (
                  <TouchableOpacity
                    style={styles.newTaskBtn}
                    onPress={() => { play('tap'); startNewTask(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.newTaskBtnText}>+ New task</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.newTaskForm}>
                    {/* Emoji row */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.emojiRow}
                    >
                      {EMOJI_OPTIONS.map((em) => (
                        <TouchableOpacity
                          key={em}
                          style={[styles.emojiCell, newEmoji === em && styles.emojiActive]}
                          onPress={() => { play('tap'); setNewEmoji(em); }}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.emojiText}>{em}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Task name input */}
                    <TextInput
                      style={styles.input}
                      value={newTitle}
                      onChangeText={setNewTitle}
                      placeholder="What do you want to focus on?"
                      placeholderTextColor={Colors.inkFaint}
                      returnKeyType="next"
                      autoFocus
                    />
                    <View style={styles.underline} />

                    {/* Memo */}
                    <TextInput
                      style={[styles.input, { marginTop: 14 }]}
                      value={newMemo}
                      onChangeText={(t) => setNewMemo(t.slice(0, 60))}
                      placeholder="Short note… (optional)"
                      placeholderTextColor={Colors.inkFaint}
                      returnKeyType="done"
                      maxLength={60}
                    />
                    <View style={styles.underlineRow}>
                      <View style={[styles.underline, { flex: 1 }]} />
                      <Text style={styles.charCount}>{newMemo.length}/60</Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.nextBtn, !step0Valid && styles.btnDisabled]}
                  disabled={!step0Valid}
                  onPress={handleNext}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>

              {/* ── STEP 1: Companion ──────────────────────── */}
              <View style={styles.page}>
                <Text style={styles.stepTitle}>Choose your companion</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.petChipRow}
                >
                  {pets.map((p) => {
                    const def    = PETS.find((d) => d.id === p.name.toLowerCase()) ?? PETS[0];
                    const active = selectedPetId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.petChip,
                          active && { borderColor: def.accent, backgroundColor: 'rgba(255,255,255,0.80)' },
                        ]}
                        onPress={() => { play('tap'); setSelectedPetId(p.id); }}
                        activeOpacity={0.8}
                      >
                        <PetRenderer pet={def} size={60} interactive={false} />
                        <Text style={[styles.petName, active && { color: def.accent, fontWeight: '700' }]}>
                          {def.name}
                        </Text>
                        {active && <View style={[styles.petDot, { backgroundColor: def.accent }]} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.rowBtns}>
                  <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
                    <Text style={styles.backBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nextBtn, { flex: 1 }, !selectedPetId && styles.btnDisabled]}
                    disabled={!selectedPetId}
                    onPress={handleNext}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.nextBtnText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── STEP 2: Duration ───────────────────────── */}
              <View style={styles.page}>
                <Text style={styles.stepTitle}>Set your focus time</Text>
                <CircularDurationPicker value={duration} onChange={setDuration} />

                <View style={styles.rowBtns}>
                  <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
                    <Text style={styles.backBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.startBtn, { flex: 1 }, creating && styles.btnDisabled]}
                    disabled={creating}
                    onPress={handleStart}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.startBtnText}>
                      {creating ? 'Starting…' : 'START FOCUS →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },

  sheet: {
    backgroundColor: Colors.softBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    overflow: 'hidden',
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(20,16,28,0.12)',
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.pinkText,
  },

  overflow: { overflow: 'hidden', width: SCREEN_W },

  pagesRow: {
    flexDirection: 'row',
    width: SCREEN_W * 3,
  },

  page: {
    width: SCREEN_W,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  stepTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    fontWeight: '500',
    color: Colors.ink,
    marginBottom: 20,
  },

  // Task step
  noTaskChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(20,16,28,0.06)',
    alignSelf: 'flex-start',
  },
  noTaskText: { fontSize: 14, fontWeight: '500', color: Colors.inkSoft },

  taskChipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  taskChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.05)',
    borderWidth: 1, borderColor: 'transparent',
    maxWidth: 200,
  },
  taskChipText: { fontSize: 13, fontWeight: '500', color: Colors.inkSoft },

  chipActive: { backgroundColor: PINK, borderColor: PINK_TEXT },
  chipActiveText: { color: PINK_TEXT, fontWeight: '600' },

  newTaskBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: Colors.pinkText,
    alignSelf: 'flex-start',
  },
  newTaskBtnText: { fontSize: 13, fontWeight: '600', color: Colors.pinkText },

  newTaskForm: { marginTop: 14, gap: 4 },

  emojiRow: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  emojiCell: {
    width: 44, height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,16,28,0.05)',
  },
  emojiActive: { backgroundColor: PINK },
  emojiText: { fontSize: 22 },

  input: {
    fontSize: 16,
    color: Colors.ink,
    paddingVertical: 6,
  },
  underline: { height: 1, backgroundColor: 'rgba(20,16,28,0.15)' },
  underlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  charCount: { fontSize: 11, color: Colors.inkFaint },

  // Pet step
  petChipRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  petChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(20,16,28,0.04)',
    gap: 6,
    minWidth: 84,
    position: 'relative',
  },
  petName: { fontSize: 12, color: Colors.inkSoft, letterSpacing: 0.2 },
  petDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5 },

  // Buttons
  rowBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },

  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },

  nextBtn: {
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1.5 },

  startBtn: {
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: Colors.pinkText,
    alignItems: 'center',
    shadowColor: Colors.pinkText,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2 },

  btnDisabled: { opacity: 0.45 },
});
