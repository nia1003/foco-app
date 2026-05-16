import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/theme';
import type { SessionRecord } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
// Calendar fits inside a FrostCard with 22px horizontal padding on each side, inside 18px screen padding
const CAL_W = SCREEN_W - 18 * 2 - 22 * 2;
const CELL_SIZE = Math.floor(CAL_W / 7);

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function sessionsForDay(sessions: SessionRecord[], date: Date): SessionRecord[] {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return sessions.filter((s) => {
    const t = new Date(s.ended_at).getTime();
    return t >= dayStart.getTime() && t <= dayEnd.getTime();
  });
}

interface MonthCalendarProps {
  sessions: SessionRecord[];
  selectedDate: Date | null;
  onDayPress: (date: Date, daySessions: SessionRecord[]) => void;
}

export function MonthCalendar({ sessions, selectedDate, onDayPress }: MonthCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  // Build day grid: pad with nulls for weekday offset
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0=Sun

  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.chevron}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{viewYear}年 {MONTH_NAMES[viewMonth]}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={styles.row}>
        {WEEKDAYS.map((d) => (
          <View key={d} style={styles.cell}>
            <Text style={styles.weekdayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {Array.from({ length: cells.length / 7 }, (_, weekIdx) => (
        <View key={weekIdx} style={styles.row}>
          {cells.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, i) => {
            if (!date) return <View key={i} style={styles.cell} />;

            const daySessions = sessionsForDay(sessions, date);
            const count = daySessions.length;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const isFuture = date > today;

            let dotBg: string | undefined;
            if (count >= 3) dotBg = Colors.pinkText;
            else if (count >= 1) dotBg = Colors.pinkHot;

            return (
              <TouchableOpacity
                key={i}
                style={styles.cell}
                onPress={() => !isFuture && onDayPress(date, daySessions)}
                activeOpacity={isFuture ? 1 : 0.7}
              >
                <View style={[
                  styles.dayCircle,
                  dotBg ? { backgroundColor: dotBg } : styles.dayCircleEmpty,
                  isToday && styles.dayCircleToday,
                  isSelected && styles.dayCircleSelected,
                ]}>
                  <Text style={[
                    styles.dayNum,
                    isFuture && styles.dayNumFuture,
                    count >= 3 && styles.dayNumActive,
                    isSelected && styles.dayNumSelected,
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

const CIRCLE = CELL_SIZE - 8;

const styles = StyleSheet.create({
  root: { width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chevron: { fontSize: 22, color: Colors.inkSoft, paddingHorizontal: 4 },
  monthTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkFaint,
    textAlign: 'center',
  },
  dayCircle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleEmpty: {
    borderWidth: 1,
    borderColor: 'rgba(26,22,34,0.08)',
    backgroundColor: 'transparent',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: Colors.pinkText,
  },
  dayCircleSelected: {
    borderWidth: 2,
    borderColor: Colors.ink,
  },
  dayNum: { fontSize: 12, fontWeight: '500', color: Colors.ink },
  dayNumFuture: { color: Colors.inkFaint },
  dayNumActive: { color: '#fff' },
  dayNumSelected: { fontWeight: '700' },
});
