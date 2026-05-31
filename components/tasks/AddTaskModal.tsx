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
const YEAR_OPTION_COUNT = 6;
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);
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

function createYearOptions(): WheelOption[] {
  const startYear = new Date().getFullYear();
  return Array.from({ length: YEAR_OPTION_COUNT }, (_, index) => ({
    label: String(startYear + index),
    value: startYear + index,
  }));
}

function createMonthOptions(): WheelOption[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      label: pad2(month),
      value: month,
    };
  });
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function createDayOptions(year: number, month: number): WheelOption[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const day = index + 1;
    return {
      label: pad2(day),
      value: day,
    };
  });
}

function formatDeadlineSummary(year: number, month: number, day: number, hour: number, minute: number) {
  return `${year}/${pad2(month)}/${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;
}

function buildDeadlineIso(year: number, month: number, day: number, hour: number, minute: number) {
  const due = new Date(year, month - 1, day, hour, minute, 0, 0);
  return due.toISOString();
}

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(length - 1, index));
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
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHourIndex, setSelectedHourIndex] = useState(23);
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const yearOptions = useMemo(() => createYearOptions(), [visible]);
  const monthOptions = useMemo(() => createMonthOptions(), []);
  const hourOptions = useMemo(
    () => HOUR_OPTIONS.map((hour) => ({ label: pad2(hour), value: hour })),
    [],
  );
  const minuteOptions = useMemo(
    () => MINUTE_OPTIONS.map((minute) => ({ label: pad2(minute), value: minute })),
    [],
  );

  const defaultSelection = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const yearIndex = Math.max(0, yearOptions.findIndex((option) => option.value === date.getFullYear()));
    return {
      yearIndex,
      monthIndex: date.getMonth(),
      dayIndex: date.getDate() - 1,
      hourIndex: date.getHours(),
      minuteIndex: date.getMinutes(),
    };
  }, [yearOptions, visible]);

  const currentYearIndex = clampIndex(selectedYearIndex, yearOptions.length);
  const currentMonthIndex = clampIndex(selectedMonthIndex, monthOptions.length);
  const currentHourIndex = clampIndex(selectedHourIndex, hourOptions.length);
  const currentMinuteIndex = clampIndex(selectedMinuteIndex, minuteOptions.length);
  const currentYear = yearOptions[currentYearIndex]?.value ?? yearOptions[0]?.value ?? new Date().getFullYear();
  const currentMonth = monthOptions[currentMonthIndex]?.value ?? 1;
  const dayOptions = useMemo(() => createDayOptions(currentYear, currentMonth), [currentYear, currentMonth]);
  const currentDayIndex = clampIndex(selectedDayIndex, dayOptions.length);
  const currentDay = dayOptions[currentDayIndex]?.value ?? 1;

  const syncDeadline = useCallback((
    yearIndex: number,
    monthIndex: number,
    dayIndex: number,
    hourIndex: number,
    minuteIndex: number,
  ) => {
    const year = yearOptions[clampIndex(yearIndex, yearOptions.length)]?.value ?? currentYear;
    const month = monthOptions[clampIndex(monthIndex, monthOptions.length)]?.value ?? currentMonth;
    const days = createDayOptions(year, month);
    const day = days[clampIndex(dayIndex, days.length)]?.value ?? 1;
    const hour = hourOptions[clampIndex(hourIndex, hourOptions.length)]?.value ?? 0;
    const minute = minuteOptions[clampIndex(minuteIndex, minuteOptions.length)]?.value ?? 0;
    setDeadlineAt(buildDeadlineIso(year, month, day, hour, minute));
  }, [currentMonth, currentYear, hourOptions, minuteOptions, monthOptions, yearOptions]);

  const resetForm = useCallback(() => {
    setTitle('');
    setMemo('');
    setDurationMin(defaultDurationMin);
    setHasDeadline(false);
    setDeadlineAt(null);
    setSelectedYearIndex(defaultSelection.yearIndex);
    setSelectedMonthIndex(defaultSelection.monthIndex);
    setSelectedDayIndex(defaultSelection.dayIndex);
    setSelectedHourIndex(defaultSelection.hourIndex);
    setSelectedMinuteIndex(defaultSelection.minuteIndex);
    setSaving(false);
  }, [defaultDurationMin, defaultSelection.dayIndex, defaultSelection.hourIndex, defaultSelection.minuteIndex, defaultSelection.monthIndex, defaultSelection.yearIndex]);

  const handleToggleDeadline = (value: boolean) => {
    setHasDeadline(value);
    if (value) {
      syncDeadline(currentYearIndex, currentMonthIndex, currentDayIndex, currentHourIndex, currentMinuteIndex);
    } else {
      setDeadlineAt(null);
    }
  };

  const handleYearSelect = (index: number) => {
    const nextYearIndex = clampIndex(index, yearOptions.length);
    const nextYear = yearOptions[nextYearIndex]?.value ?? currentYear;
    const nextDayOptions = createDayOptions(nextYear, currentMonth);
    const nextDayIndex = clampIndex(currentDayIndex, nextDayOptions.length);
    setSelectedYearIndex(nextYearIndex);
    if (nextDayIndex !== currentDayIndex) {
      setSelectedDayIndex(nextDayIndex);
    }
    syncDeadline(nextYearIndex, currentMonthIndex, nextDayIndex, currentHourIndex, currentMinuteIndex);
  };

  const handleMonthSelect = (index: number) => {
    const nextMonthIndex = clampIndex(index, monthOptions.length);
    const nextMonth = monthOptions[nextMonthIndex]?.value ?? currentMonth;
    const nextDayOptions = createDayOptions(currentYear, nextMonth);
    const nextDayIndex = clampIndex(currentDayIndex, nextDayOptions.length);
    setSelectedMonthIndex(nextMonthIndex);
    if (nextDayIndex !== currentDayIndex) {
      setSelectedDayIndex(nextDayIndex);
    }
    syncDeadline(currentYearIndex, nextMonthIndex, nextDayIndex, currentHourIndex, currentMinuteIndex);
  };

  const handleDaySelect = (index: number) => {
    const nextDayIndex = clampIndex(index, dayOptions.length);
    setSelectedDayIndex(nextDayIndex);
    syncDeadline(currentYearIndex, currentMonthIndex, nextDayIndex, currentHourIndex, currentMinuteIndex);
  };

  const handleHourSelect = (index: number) => {
    const nextHourIndex = clampIndex(index, hourOptions.length);
    setSelectedHourIndex(nextHourIndex);
    syncDeadline(currentYearIndex, currentMonthIndex, currentDayIndex, nextHourIndex, currentMinuteIndex);
  };

  const handleMinuteSelect = (index: number) => {
    const nextMinuteIndex = clampIndex(index, minuteOptions.length);
    setSelectedMinuteIndex(nextMinuteIndex);
    syncDeadline(currentYearIndex, currentMonthIndex, currentDayIndex, currentHourIndex, nextMinuteIndex);
  };

  const deadlineLabel = formatDeadlineSummary(
    currentYear,
    currentMonth,
    currentDay,
    hourOptions[currentHourIndex]?.value ?? 0,
    minuteOptions[currentMinuteIndex]?.value ?? 0,
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
                  <View style={styles.pickerGroup}>
                    <Text style={styles.pickerGroupLabel}>日期</Text>
                    <View style={styles.wheelRow}>
                      <WheelColumn
                        label="年"
                        options={yearOptions}
                        selectedIndex={currentYearIndex}
                        onSelect={handleYearSelect}
                      />
                      <WheelColumn
                        label="月"
                        options={monthOptions}
                        selectedIndex={currentMonthIndex}
                        onSelect={handleMonthSelect}
                      />
                      <WheelColumn
                        label="日"
                        options={dayOptions}
                        selectedIndex={currentDayIndex}
                        onSelect={handleDaySelect}
                      />
                    </View>
                  </View>
                  <View style={styles.pickerGroup}>
                    <Text style={styles.pickerGroupLabel}>時間</Text>
                    <View style={styles.wheelRow}>
                      <WheelColumn
                        label="時"
                        options={hourOptions}
                        selectedIndex={currentHourIndex}
                        onSelect={handleHourSelect}
                      />
                      <WheelColumn
                        label="分"
                        options={minuteOptions}
                        selectedIndex={currentMinuteIndex}
                        onSelect={handleMinuteSelect}
                      />
                    </View>
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
  pickerGroup: {
    marginBottom: 14,
  },
  pickerGroupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5E4A7A',
    marginBottom: 8,
    letterSpacing: 0.2,
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
