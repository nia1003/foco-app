import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSound } from '@/components/SoundProvider';
import { TimerGauge } from '@/components/home/TimerGauge';
import { createTask } from '@/services/focoService';
import type { Task, TaskCategory } from '@/types';

const INK = '#1a1622';

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

  const [title, setTitle]           = useState('');
  const [memo, setMemo]             = useState('');
  const [durationMin, setDurationMin] = useState(defaultDurationMin);
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setMemo('');
    setDurationMin(defaultDurationMin);
    setDeadlineAt(null);
    setSaving(false);
  }, [defaultDurationMin]);

  // Quick-pick deadline helpers
  const pickDeadline = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(23, 59, 59, 0);
    setDeadlineAt(d.toISOString());
  };

  const deadlineLabel = (() => {
    if (!deadlineAt) return null;
    const diff = Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86_400_000);
    if (diff <= 0) return 'today';
    if (diff === 1) return 'tomorrow';
    return `${diff} days`;
  })();

  useEffect(() => {
    if (visible) resetForm();
  }, [visible, resetForm]);

  const handleClose = () => { resetForm(); onClose(); };

  const handleCreate = async () => {
    const trimmed     = title.trim();
    const trimmedMemo = memo.trim();
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
          duration_min: durationMin,
          status: 'pending',
          category,
          created_at: new Date().toISOString(),
          ...(trimmedMemo ? { memo: trimmedMemo } : {}),
          ...(deadlineAt ? { deadline_at: deadlineAt } : {}),
        };
        play('tap');
        onCreated(local);
        handleClose();
        return;
      }
      const created = await createTask(userId, trimmed, durationMin, {
        category,
        ...(trimmedMemo ? { memo: trimmedMemo } : {}),
        ...(deadlineAt ? { deadline_at: deadlineAt } : {}),
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
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>+ Task</Text>
            <Text style={styles.subtitle}>
              {category === 'daily' ? 'Daily habit' : 'One-time task'}
            </Text>

            {/* Task name */}
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task name…"
              placeholderTextColor="rgba(26,22,34,0.35)"
              autoFocus
              returnKeyType="next"
            />

            {/* Memo */}
            <TextInput
              style={[styles.input, styles.memoInput]}
              value={memo}
              onChangeText={setMemo}
              placeholder="Memo (optional)"
              placeholderTextColor="rgba(26,22,34,0.35)"
              multiline
              textAlignVertical="top"
            />

            {/* Deadline picker — only for one-time tasks */}
            {category === 'task' && (
              <>
                <Text style={styles.timerLabel}>deadline (optional)</Text>
                <View style={styles.deadlineRow}>
                  {(['today', 'tomorrow', '3 days', '1 week'] as const).map((label, i) => {
                    const days = [0, 1, 3, 7][i];
                    const isActive = (() => {
                      if (!deadlineAt) return false;
                      const diff = Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86_400_000);
                      return diff === days || (days === 0 && diff <= 0);
                    })();
                    return (
                      <TouchableOpacity
                        key={label}
                        style={[styles.deadlineChip, isActive && styles.deadlineChipActive]}
                        onPress={() => isActive ? setDeadlineAt(null) : pickDeadline(days)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.deadlineChipText, isActive && styles.deadlineChipTextActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {deadlineLabel && (
                  <Text style={styles.deadlineSelected}>Due: {deadlineLabel}</Text>
                )}
              </>
            )}

            {/* Timer */}
            <Text style={styles.timerLabel}>focus duration</Text>
            <TimerGauge value={durationMin} onChange={setDurationMin} />

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, saving && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.createText}>{saving ? 'Saving…' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
    maxHeight: '90%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(26,22,34,0.45)',
    marginBottom: 22,
  },
  input: {
    fontSize: 16,
    color: INK,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(26,22,34,0.20)',
    marginBottom: 16,
  },
  memoInput: {
    fontSize: 14,
    minHeight: 56,
    lineHeight: 20,
    marginBottom: 24,
  },
  timerLabel: {
    fontSize: 13,
    color: 'rgba(26,22,34,0.55)',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  deadlineRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  deadlineChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: '#F0EAF8',
    borderWidth: 1,
    borderColor: 'rgba(124,77,204,0.15)',
  },
  deadlineChipActive: {
    backgroundColor: '#7C4DCC',
    borderColor: '#7C4DCC',
  },
  deadlineChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C4DCC',
  },
  deadlineChipTextActive: {
    color: '#ffffff',
  },
  deadlineSelected: {
    fontSize: 12,
    color: 'rgba(26,22,34,0.45)',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#E6E6E6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(26,22,34,0.55)',
  },
  createBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
