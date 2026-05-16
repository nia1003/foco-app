/**
 * FocusSetupSheet — full-screen 3-step flow for starting a focus session.
 *   Step 0: Task name + emoji + optional memo (or "No task")
 *   Step 1: Companion pet selection
 *   Step 2: Circular duration picker → START FOCUS
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
import { AppBackground } from '@/components/ui/AppBackground';
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
  tasks?: Task[];
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

  function goToStep(s: number, animate = true) {
    setStep(s);
    if (animate) {
      Animated.spring(slideAnim, {
        toValue: -s * SCREEN_W,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      slideAnim.setValue(-s * SCREEN_W);
    }
  }

  function handleNext() {
    play('tap');
    goToStep(step + 1);
  }

  function handleBack() {
    play('tap');
    goToStep(step - 1);
  }

  async function handleStart() {
    if (selectedPetId && selectedPetId !== activePet?.id) {
      await setActivePet(selectedPetId);
    }

    let taskId: string | null = selectedTaskId;
    let taskTitle: string | undefined;

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

  const step0Valid   = taskMode !== 'new' || newTitle.trim().length > 0;
  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  const STEP_LABELS = ['Mission', 'Companion', 'Duration'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <AppBackground />

        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {/* Step pills */}
          <View style={styles.stepPills}>
            {STEP_LABELS.map((label, i) => (
              <View key={i} style={[styles.stepPill, step === i && styles.stepPillActive]}>
                <Text style={[styles.stepPillText, step === i && styles.stepPillTextActive]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* ── Pages ──────────────────────────────────────── */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.pagesClip}>
            <Animated.View
              style={[styles.pagesRow, { transform: [{ translateX: slideAnim }] }]}
            >
              {/* ── STEP 0: Task ─────────────────────────── */}
              <ScrollView
                style={styles.page}
                contentContainerStyle={styles.pageContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.pageTitle}>What's your mission?</Text>
                <Text style={styles.pageSub}>Choose a task or start free focus.</Text>

                {/* "No task" option */}
                <TouchableOpacity
                  style={[styles.optionRow, taskMode === 'none' && styles.optionRowActive]}
                  onPress={() => { play('tap'); setTaskMode('none'); setSelectedTaskId(null); }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.optionEmoji}>✦</Text>
                  <Text style={[styles.optionLabel, taskMode === 'none' && styles.optionLabelActive]}>
                    Free focus
                  </Text>
                  {taskMode === 'none' && <View style={styles.checkDot} />}
                </TouchableOpacity>

                {/* Existing tasks */}
                {pendingTasks.map((t) => {
                  const active = taskMode === 'existing' && selectedTaskId === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.optionRow, active && styles.optionRowActive]}
                      onPress={() => { play('tap'); setTaskMode('existing'); setSelectedTaskId(t.id); }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.optionEmoji}>{t.emoji ?? '📌'}</Text>
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive]} numberOfLines={1}>
                        {t.title}
                      </Text>
                      {active && <View style={styles.checkDot} />}
                    </TouchableOpacity>
                  );
                })}

                {/* New task toggle */}
                {taskMode !== 'new' ? (
                  <TouchableOpacity
                    style={styles.newTaskBtn}
                    onPress={() => { play('tap'); setTaskMode('new'); setSelectedTaskId(null); setNewTitle(''); }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.newTaskBtnText}>+ New task</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.newTaskForm}>
                    <View style={styles.newTaskHeader}>
                      <Text style={styles.formLabel}>NEW TASK</Text>
                      <TouchableOpacity onPress={() => { play('tap'); setTaskMode('none'); }}>
                        <Text style={styles.cancelSmall}>Cancel</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Emoji */}
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

                    <TextInput
                      style={[styles.input, { marginTop: 16 }]}
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

                <View style={{ height: 120 }} />
              </ScrollView>

              {/* ── STEP 1: Companion ────────────────────── */}
              <ScrollView
                style={styles.page}
                contentContainerStyle={styles.pageContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.pageTitle}>Choose your companion</Text>
                <Text style={styles.pageSub}>Who's focusing with you today?</Text>

                <View style={styles.petGrid}>
                  {pets.map((p) => {
                    const def    = PETS.find((d) => d.id === p.name.toLowerCase()) ?? PETS[0];
                    const active = selectedPetId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.petCard,
                          active && { borderColor: def.accent, backgroundColor: 'rgba(255,255,255,0.85)' },
                        ]}
                        onPress={() => { play('tap'); setSelectedPetId(p.id); }}
                        activeOpacity={0.8}
                      >
                        <PetRenderer pet={def} size={80} interactive={false} />
                        <Text style={[styles.petName, active && { color: def.accent, fontWeight: '700' }]}>
                          {def.name}
                        </Text>
                        {active && <View style={[styles.petActiveDot, { backgroundColor: def.accent }]} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ height: 120 }} />
              </ScrollView>

              {/* ── STEP 2: Duration ─────────────────────── */}
              <View style={[styles.page, styles.durationPage]}>
                <Text style={styles.pageTitle}>Set your focus time</Text>
                <Text style={styles.pageSub}>Drag the ring to choose minutes.</Text>
                <View style={styles.pickerWrap}>
                  <CircularDurationPicker value={duration} onChange={setDuration} />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* ── Bottom nav bar ─────────────────────────────── */}
          <View style={styles.navBar}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
            )}

            {step < 2 ? (
              <TouchableOpacity
                style={[styles.nextBtn, !step0Valid && step === 0 && styles.btnDisabled]}
                disabled={!step0Valid && step === 0}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.startBtn, creating && styles.btnDisabled]}
                disabled={creating}
                onPress={handleStart}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>
                  {creating ? 'Starting…' : 'START FOCUS →'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,16,28,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: Colors.ink },

  stepPills: { flexDirection: 'row', gap: 6 },
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.06)',
  },
  stepPillActive: { backgroundColor: Colors.ink },
  stepPillText: { fontSize: 11, fontWeight: '600', color: Colors.inkFaint },
  stepPillTextActive: { color: '#fff' },

  // Pages
  pagesClip: { flex: 1, overflow: 'hidden' },
  pagesRow: {
    flexDirection: 'row',
    width: SCREEN_W * 3,
    flex: 1,
  },
  page: {
    width: SCREEN_W,
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  durationPage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  pageTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28,
    fontWeight: '500',
    color: Colors.ink,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 14,
    color: Colors.inkSoft,
    marginBottom: 28,
  },

  // Task option rows
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(20,16,28,0.04)',
    marginBottom: 10,
    gap: 12,
  },
  optionRowActive: {
    backgroundColor: PINK,
    borderColor: PINK_TEXT,
  },
  optionEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.inkSoft },
  optionLabelActive: { color: PINK_TEXT, fontWeight: '600' },
  checkDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: PINK_TEXT,
  },

  // New task form
  newTaskBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: Colors.pinkText,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  newTaskBtnText: { fontSize: 13, fontWeight: '600', color: Colors.pinkText },

  newTaskForm: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    padding: 16,
    gap: 4,
  },
  newTaskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  formLabel: { fontSize: 11, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.2 },
  cancelSmall: { fontSize: 13, color: Colors.inkSoft },

  emojiRow: { flexDirection: 'row', gap: 8, paddingBottom: 14 },
  emojiCell: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(20,16,28,0.05)',
  },
  emojiActive: { backgroundColor: PINK },
  emojiText: { fontSize: 22 },

  input: { fontSize: 16, color: Colors.ink, paddingVertical: 6 },
  underline: { height: 1, backgroundColor: 'rgba(20,16,28,0.15)' },
  underlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  charCount: { fontSize: 11, color: Colors.inkFaint },

  // Pet grid — 2 columns
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: SCREEN_W - 48,
  },
  petCard: {
    width: (SCREEN_W - 48 - 12) / 2,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(20,16,28,0.04)',
    gap: 8,
    position: 'relative',
  },
  petName: { fontSize: 13, color: Colors.inkSoft, fontWeight: '500' },
  petActiveDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4 },

  // Duration
  pickerWrap: { marginTop: 16 },

  // Bottom nav — centered
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'transparent',
  },

  backBtn: {
    width: 100,
    paddingVertical: 18,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.07)',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },

  nextBtn: {
    width: 220,
    paddingVertical: 18,
    borderRadius: 9999,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 1.5 },

  startBtn: {
    width: 220,
    paddingVertical: 18,
    borderRadius: 9999,
    backgroundColor: Colors.pinkText,
    alignItems: 'center',
    shadowColor: Colors.pinkText,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 2 },

  btnDisabled: { opacity: 0.4 },
});
