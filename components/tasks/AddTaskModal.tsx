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
const WHEEL_ITEM_HEIGHT = 34;
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatMonthTitle(year: number, monthIndex: number) {
  return `${year}/${pad2(monthIndex + 1)}`;
}

function buildCalendarCells(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDay.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDeadlineSummary(date: Date, hour: number, minute: number) {
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(hour)}:${pad2(minute)}`;
}

function buildDeadlineIso(date: Date, hour: number, minute: number) {
  const due = new Date(date);
  due.setHours(hour, minute, 0, 0);
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
  const lastIndexRef = useRef(selectedIndex);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * WHEEL_ITEM_HEIGHT,
      animated: false,
    });
    lastIndexRef.current = selectedIndex;
  }, [options.length]);

  const resolveIndex = (y: number) =>
    Math.max(0, Math.min(options.length - 1, Math.round(y / WHEEL_ITEM_HEIGHT)));

  const handleScroll = (y: number) => {
    const index = resolveIndex(y);
    if (index !== lastIndexRef.current) {
      lastIndexRef.current = index;
      onSelect(index);
    }
  };

  const handleScrollEnd = (y: number) => {
    const index = resolveIndex(y);
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: true });
    lastIndexRef.current = index;
    onSelect(index);
  };

  const handlePress = (index: number) => {
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: true });
    lastIndexRef.current = index;
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
          decelerationRate="normal"
          scrollEventThrottle={16}
          contentOffset={{ x: 0, y: selectedIndex * WHEEL_ITEM_HEIGHT }}
          contentContainerStyle={styles.wheelContent}
          onScroll={(event) => handleScroll(event.nativeEvent.contentOffset.y)}
          onMomentumScrollEnd={(event) => handleScrollEnd(event.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(event) => handleScrollEnd(event.nativeEvent.contentOffset.y)}
          nestedScrollEnabled
          directionalLockEnabled
        >
          {options.map((option, index) => {
            const selected = index === selectedIndex;
            return (
              <TouchableOpacity
                key={`${label}-${option.value}`}
                style={styles.wheelItem}
                onPress={() => handlePress(index)}
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

function CalendarPicker({
  selectedDate,
  viewYear,
  viewMonth,
  onMonthChange,
  onSelectDate,
}: {
  selectedDate: Date;
  viewYear: number;
  viewMonth: number;
  onMonthChange: (year: number, month: number) => void;
  onSelectDate: (date: Date) => void;
}) {
  const today = startOfDay(new Date());
  const cells = buildCalendarCells(viewYear, viewMonth);

  const shiftMonth = (amount: number) => {
    const next = new Date(viewYear, viewMonth + amount, 1);
    onMonthChange(next.getFullYear(), next.getMonth());
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          style={styles.calendarNav}
          onPress={() => shiftMonth(-1)}
          activeOpacity={0.75}
        >
          <Text style={styles.calendarNavText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.calendarTitle}>{formatMonthTitle(viewYear, viewMonth)}</Text>
        <TouchableOpacity
          style={styles.calendarNav}
          onPress={() => shiftMonth(1)}
          activeOpacity={0.75}
        >
          <Text style={styles.calendarNavText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarRow}>
        {WEEKDAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, weekIndex) => (
        <View key={weekIndex} style={styles.calendarRow}>
          {cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, dayIndex) => {
            if (!date) return <View key={dayIndex} style={styles.calendarCell} />;

            const disabled = startOfDay(date).getTime() < today.getTime();
            const selected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);

            return (
              <TouchableOpacity
                key={date.toISOString()}
                style={styles.calendarCell}
                onPress={() => !disabled && onSelectDate(date)}
                activeOpacity={disabled ? 1 : 0.75}
              >
                <View style={[
                  styles.calendarDay,
                  isToday && styles.calendarDayToday,
                  selected && styles.calendarDaySelected,
                  disabled && styles.calendarDayDisabled,
                ]}>
                  <Text style={[
                    styles.calendarDayText,
                    selected && styles.calendarDayTextSelected,
                    disabled && styles.calendarDayTextDisabled,
                  ]}>
                    {date.getDate()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
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
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [calendarViewYear, setCalendarViewYear] = useState(() => new Date().getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => new Date().getMonth());
  const [selectedHourIndex, setSelectedHourIndex] = useState(23);
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(11);
  const [saving, setSaving] = useState(false);

  const hourOptions = useMemo(
    () => HOUR_OPTIONS.map((hour) => ({ label: pad2(hour), value: hour })),
    [],
  );
  const minuteOptions = useMemo(
    () => MINUTE_OPTIONS.map((minute) => ({ label: pad2(minute), value: minute })),
    [],
  );

  const defaultDeadline = useMemo(() => {
    const date = new Date();
    return {
      date: startOfDay(date),
      viewYear: date.getFullYear(),
      viewMonth: date.getMonth(),
      hourIndex: 23,
      minuteIndex: 11,
    };
  }, [visible]);

  const currentHourIndex = clampIndex(selectedHourIndex, hourOptions.length);
  const currentMinuteIndex = clampIndex(selectedMinuteIndex, minuteOptions.length);

  const syncDeadline = useCallback((
    date: Date,
    hourIndex: number,
    minuteIndex: number,
  ) => {
    const hour = hourOptions[clampIndex(hourIndex, hourOptions.length)]?.value ?? 0;
    const minute = minuteOptions[clampIndex(minuteIndex, minuteOptions.length)]?.value ?? 0;
    setDeadlineAt(buildDeadlineIso(date, hour, minute));
  }, [hourOptions, minuteOptions]);

  const resetForm = useCallback(() => {
    setTitle('');
    setMemo('');
    setDurationMin(defaultDurationMin);
    setHasDeadline(false);
    setDeadlineAt(null);
    setSelectedDate(defaultDeadline.date);
    setCalendarViewYear(defaultDeadline.viewYear);
    setCalendarViewMonth(defaultDeadline.viewMonth);
    setSelectedHourIndex(defaultDeadline.hourIndex);
    setSelectedMinuteIndex(defaultDeadline.minuteIndex);
    setSaving(false);
  }, [defaultDeadline.date, defaultDeadline.hourIndex, defaultDeadline.minuteIndex, defaultDeadline.viewMonth, defaultDeadline.viewYear, defaultDurationMin]);

  const handleToggleDeadline = (value: boolean) => {
    setHasDeadline(value);
    if (value) {
      syncDeadline(selectedDate, currentHourIndex, currentMinuteIndex);
    } else {
      setDeadlineAt(null);
    }
  };

  const handleDateSelect = (date: Date) => {
    const nextDate = startOfDay(date);
    setSelectedDate(nextDate);
    syncDeadline(nextDate, currentHourIndex, currentMinuteIndex);
  };

  const handleCalendarMonthChange = (year: number, month: number) => {
    setCalendarViewYear(year);
    setCalendarViewMonth(month);
  };

  const handleHourSelect = (index: number) => {
    const nextHourIndex = clampIndex(index, hourOptions.length);
    setSelectedHourIndex(nextHourIndex);
    syncDeadline(selectedDate, nextHourIndex, currentMinuteIndex);
  };

  const handleMinuteSelect = (index: number) => {
    const nextMinuteIndex = clampIndex(index, minuteOptions.length);
    setSelectedMinuteIndex(nextMinuteIndex);
    syncDeadline(selectedDate, currentHourIndex, nextMinuteIndex);
  };

  const deadlineLabel = formatDeadlineSummary(
    selectedDate,
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
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
                    <Text style={styles.pickerGroupLabel}>Date</Text>
                    <CalendarPicker
                      selectedDate={selectedDate}
                      viewYear={calendarViewYear}
                      viewMonth={calendarViewMonth}
                      onMonthChange={handleCalendarMonthChange}
                      onSelectDate={handleDateSelect}
                    />
                  </View>
                  <View style={styles.pickerGroup}>
                    <Text style={styles.pickerGroupLabel}>Time</Text>
                    <View style={styles.wheelRow}>
                      <WheelColumn
                        label="Hour"
                        options={hourOptions}
                        selectedIndex={currentHourIndex}
                        onSelect={handleHourSelect}
                      />
                      <WheelColumn
                        label="Minute"
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
  calendar: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(124,77,204,0.15)',
    padding: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarNav: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,77,204,0.10)',
  },
  calendarNavText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#7C4DCC',
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: INK,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(26,22,34,0.38)',
    paddingVertical: 5,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: 'rgba(124,77,204,0.45)',
  },
  calendarDaySelected: {
    backgroundColor: '#7C4DCC',
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: INK,
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
  },
  calendarDayTextDisabled: {
    color: 'rgba(26,22,34,0.35)',
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
