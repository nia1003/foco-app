import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Edit3 } from 'lucide-react-native';
import { TaskIcon } from '@/components/tasks/TaskIcon';
import { TaskIconPickerContent } from '@/components/tasks/TaskIconPickerContent';
import { DEFAULT_TASK_ICON, type TaskIconValue } from '@/lib/taskIcon';
import { useSound } from '@/components/SoundProvider';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTaskStore } from '@/stores/taskStore';
import { mockPets } from '@/data/mockData';
import { useFocusLaunch } from '@/hooks/useFocusLaunch';
import type { FocusQuickSetupValue } from '@/components/home/FocusQuickSetup';
import { updateTask as updateTaskApi } from '@/services/focoService';
import type { Task } from '@/types';
import MissionsScreen from './index';

export default function MissionTaskScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { play } = useSound();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { launchFocus } = useFocusLaunch();

  const { userId } = useAuthStore();
  const { pets, activePet } = usePetStore();
  const focusDurationMin = usePreferencesStore((s) => s.focusDurationMin);
  const { tasks, fetchTasks, updateTask: updateTaskInStore } = useTaskStore();
  const backdropOpacity = useMemo(() => new Animated.Value(0), []);
  const sheetOpacity = useMemo(() => new Animated.Value(0), []);
  const sheetTranslateY = useMemo(() => new Animated.Value(22), []);
  const sheetScale = useMemo(() => new Animated.Value(0.98), []);

  const taskId = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  const task = useMemo(
    () => tasks.find((item) => item.id === taskId) ?? null,
    [tasks, taskId],
  );
  const modalPets = pets.length > 0 ? pets : mockPets.slice(0, 1);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [icon, setIcon] = useState<TaskIconValue>(DEFAULT_TASK_ICON);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetScale, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, sheetOpacity, sheetScale, sheetTranslateY]);

  useEffect(() => {
    if (!userId) {
      setFetchAttempted(true);
      return;
    }
    fetchTasks(userId, { force: true }).finally(() => setFetchAttempted(true));
  }, [userId, fetchTasks]);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setMemo(task.memo ?? '');
    setIcon(
      task.icon_type && task.icon_value
        ? { type: task.icon_type, value: task.icon_value }
        : DEFAULT_TASK_ICON,
    );
    setEditing(false);
    setIconPickerOpen(false);
    setSaving(false);
  }, [task]);

  const pendingTasks = tasks.filter((item) => item.status === 'pending');

  const buildSetup = (
    partial: Partial<FocusQuickSetupValue>,
  ): FocusQuickSetupValue => ({
    taskMode: 'none',
    selectedTaskId: null,
    newIconType: 'emoji',
    newIcon: '??',
    newTitle: '',
    newMemo: '',
    selectedPetId: activePet?.id ?? modalPets[0]?.id ?? null,
    durationMin: focusDurationMin,
    ...partial,
  });

  const handleStart = async () => {
    if (!task) return;
    play('tap');
    const setup = buildSetup({
      taskMode: 'existing',
      selectedTaskId: task.id,
      durationMin: task.duration_min,
    });
    await launchFocus(setup, pendingTasks, { fallbackTitle: task.title });
  };

  const handleConfirm = async () => {
    if (!task) return;
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Title required', 'Enter a task name to continue.');
      return;
    }

    const trimmedMemo = memo.trim();
    setSaving(true);
    try {
      const updated = await updateTaskApi(task.id, {
        title: trimmed,
        durationMin: task.duration_min,
        category: task.category ?? 'task',
        icon_type: icon.type,
        icon_value: icon.value,
        memo: trimmedMemo ? trimmedMemo : null,
      });
      updateTaskInStore(updated);
      play('tap');
      setEditing(false);
    } catch {
      Alert.alert('Could not update task', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 18,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetScale, {
        toValue: 0.98,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => router.replace('/(app)/missions'));
  };

  if (!task) {
    return (
      <View style={styles.root}>
        <MissionsScreen />
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Animated.View
            pointerEvents="none"
            style={[styles.backdropTint, { opacity: backdropOpacity }]}
          />
          <Animated.View
            style={[
              styles.sheet,
              {
                opacity: sheetOpacity,
                transform: [
                  { translateY: sheetTranslateY },
                  { scale: sheetScale },
                ],
              },
            ]}
          >
            <Text style={styles.title}>
              {fetchAttempted ? 'Task not found' : 'Loading task'}
            </Text>
            <Text style={styles.subtitle}>
              {fetchAttempted
                ? 'The task may have been deleted.'
                : 'Fetching the latest task details.'}
            </Text>
            <TouchableOpacity style={styles.createBtn} onPress={handleClose} activeOpacity={0.85}>
              <Text style={styles.createText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </View>
    );
  }

  const isReadOnly = !editing;

  return (
    <View style={styles.root}>
      <MissionsScreen />
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdropTint, { opacity: backdropOpacity }]}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: sheetOpacity,
              transform: [
                { translateY: sheetTranslateY },
                { scale: sheetScale },
              ],
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
          {iconPickerOpen ? (
            <>
              <TouchableOpacity
                style={styles.backRow}
                onPress={() => {
                  play('tap');
                  setIconPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.backText}>‹ Back</Text>
              </TouchableOpacity>
              <TaskIconPickerContent
                value={icon}
                onChange={setIcon}
                onDone={() => {
                  play('tap');
                  setIconPickerOpen(false);
                }}
              />
            </>
          ) : (
            <>
              <Text style={styles.title}>{editing ? 'Edit Task' : 'Task Details'}</Text>
              <Text style={styles.subtitle}>
                {task.category === 'daily' ? 'Daily mission' : 'Standard task'}
              </Text>

              <TouchableOpacity
                style={styles.iconRow}
                onPress={() => {
                  if (!editing) return;
                  play('tap');
                  setIconPickerOpen(true);
                }}
                activeOpacity={editing ? 0.8 : 1}
              >
                <View style={styles.iconPreview}>
                  <TaskIcon icon={icon} size={26} />
                </View>
                <Text style={styles.iconBtnLabel}>
                  {editing ? 'Change icon' : 'Icon'}
                </Text>
                <TouchableOpacity
                  style={[styles.editBtn, editing && styles.editBtnActive]}
                  onPress={() => {
                    play('tap');
                    setEditing((value) => !value);
                  }}
                  activeOpacity={0.8}
                >
                  <Edit3 size={15} color={editing ? colors.pinkText : colors.inkSoft} />
                  <Text style={[styles.editBtnText, editing && styles.editBtnTextActive]}>
                    {editing ? 'Editing' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TextInput
                style={[styles.input, isReadOnly && styles.inputReadOnly]}
                value={title}
                onChangeText={setTitle}
                placeholder="What do you want to focus on?"
                placeholderTextColor={colors.inkFaint}
                editable={editing}
                selectTextOnFocus={editing}
                autoFocus={false}
              />

              <TextInput
                style={[styles.input, styles.memoInput, isReadOnly && styles.inputReadOnly]}
                value={memo}
                onChangeText={setMemo}
                placeholder="Memo"
                placeholderTextColor={colors.inkFaint}
                editable={editing}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.durationHint}>
                Focus length: {task.duration_min} min
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    play('tap');
                    handleClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.createBtn, saving && styles.createBtnDisabled]}
                  onPress={editing ? handleConfirm : handleStart}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.createText}>
                    {saving ? 'Saving…' : editing ? 'Confirm' : 'Start'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function createStyles({ colors, surfaces }: ReturnType<typeof useAppTheme>) {
  return StyleSheet.create({
    root: { flex: 1 },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      padding: 24,
    },
    backdropTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: surfaces.modalBackdrop,
    },
    sheet: {
      borderRadius: 24,
      backgroundColor: surfaces.modalSheetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
      padding: 22,
      maxHeight: '85%',
      overflow: 'hidden',
      elevation: 12,
      shadowColor: surfaces.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    headerSpacer: { width: 56 },
    backRow: { marginBottom: 8, alignSelf: 'flex-start' },
    backText: { fontSize: 14, fontWeight: '600', color: colors.pinkText },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.ink,
      textAlign: 'center',
      flex: 1,
    },
    editBtn: {
      marginLeft: 'auto',
      minWidth: 56,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 5,
      paddingVertical: 6,
      borderRadius: 9999,
      backgroundColor: surfaces.modalInsetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
    },
    editBtnActive: {
      backgroundColor: surfaces.pillActiveBg,
      borderColor: surfaces.pillActiveBorder,
    },
    editBtnText: { fontSize: 12, fontWeight: '600', color: colors.inkSoft },
    editBtnTextActive: { color: colors.pinkText },
    subtitle: {
      fontSize: 12,
      color: colors.inkFaint,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 16,
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14,
    },
    iconPreview: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: surfaces.modalInsetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
    },
    iconBtnLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.pinkText,
    },
    input: {
      fontSize: 16,
      color: colors.ink,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: surfaces.divider,
      marginBottom: 10,
    },
    inputReadOnly: {
      color: colors.inkSoft,
    },
    memoInput: {
      minHeight: 72,
      fontSize: 14,
      lineHeight: 19,
    },
    durationHint: {
      fontSize: 12,
      color: colors.inkFaint,
      marginBottom: 18,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: surfaces.modalInsetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
    },
    cancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.inkSoft,
    },
    createBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: surfaces.ctaBg,
    },
    createBtnDisabled: { opacity: 0.6 },
    createText: {
      fontSize: 14,
      fontWeight: '700',
      color: surfaces.ctaText,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: 8,
    },
    emptySub: {
      fontSize: 13,
      color: colors.inkFaint,
      textAlign: 'center',
      lineHeight: 18,
    },
    emptyBtn: {
      marginTop: 18,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 9999,
      backgroundColor: surfaces.ctaBg,
    },
    emptyBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: surfaces.ctaText,
    },
  });
}
