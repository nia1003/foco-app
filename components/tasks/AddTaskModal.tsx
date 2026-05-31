import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const WHEEL_ITEM_HEIGHT = 42;
const DATE_OPTION_COUNT = 30;
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
  visible: boolean;
  defaultDurationMin: number;
  userId: string | null;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

const pad2 = (value: number) => String(value).padStart(2, '0');

type WheelOption = {
  label: string;
  value: number;
};

type DateWheelOption = WheelOption & {
  date: Date;
};

function formatDateOption(date: Date, index: number) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  if (index === 2) return 'Day after';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function createDateOptions(): DateWheelOption[] {
  return Array.from({ length: DATE_OPTION_COUNT }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    date.setHours(0, 0, 0, 0);
    return {
      label: formatDateOption(date, index),
      value: index,
      date,
    };
  });
}

function formatDeadlineSummary(date: DateWheelOption | undefined, hour: number, minute: number) {
  if (!date) return null;
  const due = date.date;
  return `${due.getFullYear()}/${pad2(due.getMonth() + 1)}/${pad2(due.getDate())} ${pad2(hour)}:${pad2(minute)}`;
}

function buildDeadlineIso(date: DateWheelOption | undefined, hour: number, minute: number) {
  if (!date) return null;
  const due = new Date(date.date);
  due.setHours(hour, minute, 0, 0);
  return due.toISOString();
}

function WheelColumn({
  label,
  options,
  selectedIndex,
  onSelect,
}: {
  label: string;
  options: WheelOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * WHEEL_ITEM_HEIGHT,
      animated: true,
    });
  }, [selectedIndex]);

  const handleScrollEnd = (y: number) => {
    const index = Math.max(0, Math.min(options.length - 1, Math.round(y / WHEEL_ITEM_HEIGHT)));
    onSelect(index);
  };

  return (
    <View style={styles.wheelColumn}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <View style={styles.wheelFrame}>
        <View pointerEvents="none" style={styles.wheelHighlight} />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={WHEEL_ITEM_HEIGHT}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: selectedIndex * WHEEL_ITEM_HEIGHT }}
          contentContainerStyle={styles.wheelContent}
          onMomentumScrollEnd={(event) => handleScrollEnd(event.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(event) => handleScrollEnd(event.nativeEvent.contentOffset.y)}
          nestedScrollEnabled
        >
          {options.map((option, index) => {
            const selected = index === selectedIndex;
            return (
              <TouchableOpacity
                key={`${label}-${option.value}`}
                style={styles.wheelItem}
                onPress={() => onSelect(index)}
                activeOpacity={0.75}
              >
                <Text style={[styles.wheelItemText, selected && styles.wheelItemTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
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
  const [selectedDateIndex, setSelectedDateIndex] = useState(1);
  const [selectedHourIndex, setSelectedHourIndex] = useState(23);
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(11);
  const [saving, setSaving] = useState(false);

  const dateOptions = useMemo(() => createDateOptions(), [visible]);
  const hourOptions = useMemo(
    () => HOUR_OPTIONS.map((hour) => ({ label: pad2(hour), value: hour })),
    [],
  );
  const minuteOptions = useMemo(
    () => MINUTE_OPTIONS.map((minute) => ({ label: pad2(minute), value: minute })),
    [],
  );

  const syncDeadline = useCallback((
    dateIndex: number,
    hourIndex: number,
    minuteIndex: number,
  ) => {
    setDeadlineAt(buildDeadlineIso(
      dateOptions[dateIndex],
      HOUR_OPTIONS[hourIndex],
      MINUTE_OPTIONS[minuteIndex],
    ));
  }, [dateOptions]);

  const resetForm = useCallback(() => {
    setTitle('');
    setMemo('');
    setDurationMin(defaultDurationMin);
    setHasDeadline(false);
    setDeadlineAt(null);
    setSelectedDateIndex(1);
    setSelectedHourIndex(23);
    setSelectedMinuteIndex(11);
    setSaving(false);
  }, [defaultDurationMin]);

  const handleToggleDeadline = (value: boolean) => {
    setHasDeadline(value);
    if (value) {
      syncDeadline(selectedDateIndex, selectedHourIndex, selectedMinuteIndex);
    } else {
      setDeadlineAt(null);
    }
  };

  const handleDateSelect = (index: number) => {
    setSelectedDateIndex(index);
    syncDeadline(index, selectedHourIndex, selectedMinuteIndex);
  };

  const handleHourSelect = (index: number) => {
    setSelectedHourIndex(index);
    syncDeadline(selectedDateIndex, index, selectedMinuteIndex);
  };

  const handleMinuteSelect = (index: number) => {
    setSelectedMinuteIndex(index);
    syncDeadline(selectedDateIndex, selectedHourIndex, index);
  };

  const deadlineLabel = formatDeadlineSummary(
    dateOptions[selectedDateIndex],
    HOUR_OPTIONS[selectedHourIndex],
    MINUTE_OPTIONS[selectedMinuteIndex],
  );

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
      Alert.alert('Deadline required', 'Choose a deadline date and time.');
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
                <View style={styles.pickerPanel}>
                  <View style={styles.wheelRow}>
                    <WheelColumn
                      label="Date"
                      options={dateOptions}
                      selectedIndex={selectedDateIndex}
                      onSelect={handleDateSelect}
                    />
                    <WheelColumn
                      label="Hour"
                      options={hourOptions}
                      selectedIndex={selectedHourIndex}
                      onSelect={handleHourSelect}
                    />
                    <WheelColumn
                      label="Min"
                      options={minuteOptions}
                      selectedIndex={selectedMinuteIndex}
                      onSelect={handleMinuteSelect}
                    />
                  </View>
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
  pickerPanel: {
    backgroundColor: '#F0EAF8',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  wheelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  wheelColumn: {
    flex: 1,
  },
  wheelLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(26,22,34,0.42)',
    marginBottom: 8,
    textAlign: 'center',
  },
  wheelFrame: {
    height: WHEEL_ITEM_HEIGHT * 3,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(124,77,204,0.15)',
    overflow: 'hidden',
  },
  wheelHighlight: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: WHEEL_ITEM_HEIGHT,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(124,77,204,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,77,204,0.18)',
    zIndex: 1,
  },
  wheelContent: {
    paddingVertical: WHEEL_ITEM_HEIGHT,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  wheelItemText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(26,22,34,0.40)',
  },
  wheelItemTextActive: {
    fontSize: 15,
    fontWeight: '800',
    color: INK,
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
