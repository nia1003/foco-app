import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSound } from '@/components/SoundProvider';
import { TimerGauge } from '@/components/home/TimerGauge';
import { createTask } from '@/services/focoService';
import type { Task } from '@/types';

const INK = '#1a1622';

interface Props {
  visible: boolean;
  defaultDurationMin: number;
  userId: string | null;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

function formatDeadlineInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDeadlineInput(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/);
  if (!match) return null;

  const [, year, month, day, hour = '23', minute = '59'] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsed;
}

export function AddTaskModal({
  visible,
  defaultDurationMin,
  userId,
  onClose,
  onCreated,
}: Props) {
  const { play } = useSound();

  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [durationMin, setDurationMin] = useState(defaultDurationMin);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [deadlineInput, setDeadlineInput] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setMemo('');
    setDurationMin(defaultDurationMin);
    setHasDeadline(false);
    setDeadlineAt(null);
    setDeadlineInput('');
    setSaving(false);
  }, [defaultDurationMin]);

  const setDeadlineDate = (date: Date) => {
    setDeadlineAt(date.toISOString());
    setDeadlineInput(formatDeadlineInput(date));
  };

  const pickDeadline = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(23, 59, 59, 0);
    setDeadlineDate(d);
  };

  const handleToggleDeadline = (value: boolean) => {
    setHasDeadline(value);
    if (value) {
      pickDeadline(1);
    } else {
      setDeadlineAt(null);
      setDeadlineInput('');
    }
  };

  const handleDeadlineInputChange = (value: string) => {
    setDeadlineInput(value);
    const parsed = parseDeadlineInput(value);
    setDeadlineAt(parsed ? parsed.toISOString() : null);
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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    const trimmed = title.trim();
    const trimmedMemo = memo.trim();
    if (!trimmed) {
      Alert.alert('Title required', 'Enter a task name to continue.');
      return;
    }
    if (hasDeadline && !deadlineAt) {
      Alert.alert('Invalid deadline', 'Use YYYY-MM-DD HH:mm, for example 2026-06-01 23:59.');
      return;
    }

    const category = hasDeadline ? 'task' : 'daily';
    const deadlineValue = hasDeadline ? deadlineAt : null;
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
          deadline_at: deadlineValue,
          ...(trimmedMemo ? { memo: trimmedMemo } : {}),
        };
        play('tap');
        onCreated(local);
        handleClose();
        return;
      }

      const created = await createTask(userId, trimmed, durationMin, {
        category,
        deadline_at: deadlineValue,
        ...(trimmedMemo ? { memo: trimmedMemo } : {}),
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
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>+ Task</Text>
                <Text style={styles.subtitle}>
                  {hasDeadline ? 'Deadline task' : 'Daily / no deadline'}
                </Text>
              </View>
              <View style={styles.deadlineSwitchWrap}>
                <Text style={styles.switchLabel}>Deadline</Text>
                <Switch
                  value={hasDeadline}
                  onValueChange={handleToggleDeadline}
                  trackColor={{ false: '#E6E6E6', true: 'rgba(124,77,204,0.35)' }}
                  thumbColor={hasDeadline ? '#7C4DCC' : '#ffffff'}
                />
              </View>
            </View>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task name"
              placeholderTextColor="rgba(26,22,34,0.35)"
              autoFocus
              returnKeyType="next"
            />

            <TextInput
              style={[styles.input, styles.memoInput]}
              value={memo}
              onChangeText={setMemo}
              placeholder="Memo (optional)"
              placeholderTextColor="rgba(26,22,34,0.35)"
              multiline
              textAlignVertical="top"
            />

            {hasDeadline && (
              <>
                <Text style={styles.timerLabel}>deadline</Text>
                <TextInput
                  style={styles.input}
                  value={deadlineInput}
                  onChangeText={handleDeadlineInputChange}
                  placeholder="YYYY-MM-DD HH:mm"
                  placeholderTextColor="rgba(26,22,34,0.35)"
                  keyboardType="numbers-and-punctuation"
                />
                <View style={styles.deadlineRow}>
                  {(['today', 'tomorrow', '3 days', '1 week'] as const).map((label, i) => {
                    const days = [0, 1, 3, 7][i];
                    const isActive = (() => {
                      if (!deadlineAt) return false;
                      const diff = Math.ceil(
                        (new Date(deadlineAt).getTime() - Date.now()) / 86_400_000,
                      );
                      return diff === days || (days === 0 && diff <= 0);
                    })();
                    return (
                      <TouchableOpacity
                        key={label}
                        style={[styles.deadlineChip, isActive && styles.deadlineChipActive]}
                        onPress={() => (isActive ? handleDeadlineInputChange('') : pickDeadline(days))}
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

            <Text style={styles.timerLabel}>focus duration</Text>
            <TimerGauge value={durationMin} onChange={setDurationMin} />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, saving && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.createText}>{saving ? 'Saving...' : 'Create'}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 22,
  },
  headerCopy: { flex: 1 },
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
  },
  deadlineSwitchWrap: {
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(26,22,34,0.55)',
    letterSpacing: 0.2,
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
  createBtnDisabled: { opacity: 0.5 },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
