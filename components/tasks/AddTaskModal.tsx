/**
 * AddTaskModal — create a task with icon picker (English UI).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSound } from '@/components/SoundProvider';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppTheme } from '@/hooks/useAppTheme';
import { TaskIcon } from '@/components/tasks/TaskIcon';
import { TaskIconPickerContent } from '@/components/tasks/TaskIconPickerContent';
import { DEFAULT_TASK_ICON, type TaskIconValue } from '@/lib/taskIcon';
import { createTask } from '@/services/focoService';
import type { Task, TaskCategory } from '@/types';

interface Props {
  visible: boolean;
  category: TaskCategory;
  defaultDurationMin: number;
  userId: string | null;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export function AddTaskModal({
  visible,
  category,
  defaultDurationMin,
  userId,
  onClose,
  onCreated,
}: Props) {
  const { play } = useSound();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<TaskIconValue>(DEFAULT_TASK_ICON);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setIcon(DEFAULT_TASK_ICON);
    setIconPickerOpen(false);
    setSaving(false);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
    } else {
      setIconPickerOpen(false);
    }
  }, [visible, resetForm]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Title required', 'Enter a task name to continue.');
      return;
    }
    setSaving(true);
    try {
      if (!userId) {
        const local: Task = {
          id: `local-${Date.now()}`,
          user_id: 'mock-user',
          title: trimmed,
          duration_min: defaultDurationMin,
          status: 'pending',
          category,
          created_at: new Date().toISOString(),
          icon_type: icon.type,
          icon_value: icon.value,
        };
        play('tap');
        onCreated(local);
        handleClose();
        return;
      }

      const created = await createTask(userId, trimmed, defaultDurationMin, {
        category,
        icon_type: icon.type,
        icon_value: icon.value,
      });
      play('tap');
      onCreated(created);
      handleClose();
    } catch {
      Alert.alert('Could not create task', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
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
              <Text style={styles.title}>New Task</Text>
              <Text style={styles.subtitle}>
                {category === 'daily' ? 'Daily mission' : 'Standard task'}
              </Text>

              <TouchableOpacity
                style={styles.iconRow}
                onPress={() => {
                  play('tap');
                  setIconPickerOpen(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.iconPreview}>
                  <TaskIcon icon={icon} size={26} />
                </View>
                <Text style={styles.iconBtnLabel}>Change icon</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What do you want to focus on?"
                placeholderTextColor={colors.inkFaint}
                autoFocus
              />

              <Text style={styles.durationHint}>
                Default focus length: {defaultDurationMin} min
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
                  onPress={handleCreate}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.createText}>
                    {saving ? 'Saving…' : 'Create task'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: surfaces.modalBackdrop,
      justifyContent: 'center',
      padding: 24,
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
    backRow: { marginBottom: 8, alignSelf: 'flex-start' },
    backText: { fontSize: 14, fontWeight: '600', color: colors.pinkText },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.ink,
      textAlign: 'center',
    },
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
  });
}
