/**
 * FocusCalendar — GitHub-style monthly session heatmap
 * Dot darkness = session count (0 / 1 / 2 / 3+)
 * Today: pink ring border
 * Tap a day → navigate to day-log with that week
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import type { DayData } from '@/types';

const PINK = Colors.pinkText;
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

function getDotBg(count: number): string {
  if (count === 0) return 'rgba(26,22,34,0.07)';
  if (count === 1) return 'rgba(181,96,122,0.30)';
  if (count === 2) return 'rgba(181,96,122,0.60)';
  return 'rgba(181,96,122,0.90)';
}

function toMondayStart(date: Date): Date {
  const dow = date.getDay(); // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + offset);
  return monday;
}

interface Props {
  year: number;
  month: number; // 1-based
  data: DayData[];
  onMonthChange: (year: number, month: number) => void;
}

export function FocusCalendar({ year, month, data, onMonthChange }: Props) {
  const router = useRouter();

  const todayStr = new Date().toISOString().slice(0, 10);

  const dataMap = new Map<string, number>();
  data.forEach((d) => dataMap.set(d.date, d.session_count));

  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // cells: null = padding, number = day of month
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayPress = (day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    const d = new Date(year, month - 1, day);
    const weekStart = toMondayStart(d).toISOString().slice(0, 10);
    router.push({
      pathname: '/(app)/day-log',
      params: { weekStart, focusDate: dateStr },
    } as any);
  };

  const prevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };
  const nextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  const weeks = Array.from({ length: cells.length / 7 }, (_, i) =>
    cells.slice(i * 7, (i + 1) * 7),
  );

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.6}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[month - 1]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.6}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day-of-week labels */}
      <View style={styles.row}>
        {DAY_LABELS.map((l, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayLabel}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Dot grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} style={styles.cell} />;
            }
            const pad = (n: number) => String(n).padStart(2, '0');
            const dateStr = `${year}-${pad(month)}-${pad(day)}`;
            const count = dataMap.get(dateStr) ?? 0;
            const isToday = dateStr === todayStr;

            return (
              <TouchableOpacity
                key={di}
                style={styles.cell}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: getDotBg(count) },
                    isToday && styles.dotToday,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>fewer</Text>
        {[0, 1, 2, 3].map((c) => (
          <View key={c} style={[styles.legendDot, { backgroundColor: getDotBg(c) }]} />
        ))}
        <Text style={styles.legendLabel}>more</Text>
      </View>
    </View>
  );
}

const DOT = 28;
const CELL_H = 38;

const styles = StyleSheet.create({
  container: { paddingHorizontal: 4, paddingBottom: 4 },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  navBtn: { padding: 6 },
  navArrow: { fontSize: 22, color: Colors.inkSoft, fontWeight: '300' },
  monthTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
    letterSpacing: 0.2,
  },

  row: { flexDirection: 'row', marginBottom: 5 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', height: CELL_H },

  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 0.5,
  },

  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  dotToday: {
    borderWidth: 2,
    borderColor: PINK,
  },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 9, color: Colors.inkFaint, letterSpacing: 0.3 },
});
