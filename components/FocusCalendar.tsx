/**
 * FocusCalendar — GitHub-style monthly session heatmap (theme-aware)
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppTheme } from '@/hooks/useAppTheme';
import type { DayData } from '@/types';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

function dayFocusSec(entry: DayData | undefined): number {
  if (!entry) return 0;
  if (entry.total_focus_sec > 0) return entry.total_focus_sec;
  return entry.sessions.reduce((acc, s) => acc + s.duration_min * 60, 0);
}

/** Opacity scales with focus time; level 0 = none, 1 = busiest day in this month */
function getDotBgFromFocusLevel(level: number, isDark: boolean): string {
  if (level <= 0) {
    return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,22,34,0.07)';
  }
  const minOp = isDark ? 0.28 : 0.3;
  const maxOp = isDark ? 0.92 : 0.9;
  const op = minOp + Math.min(Math.max(level, 0), 1) * (maxOp - minOp);
  return isDark ? `rgba(201,143,168,${op.toFixed(2)})` : `rgba(181,96,122,${op.toFixed(2)})`;
}

function formatFocusMinutes(sec: number): string {
  if (sec <= 0) return '0';
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h${rem}m` : `${h}h`;
}

function toMondayStart(date: Date): Date {
  const dow = date.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setDate(date.getDate() + offset);
  return monday;
}

interface Props {
  year: number;
  month: number;
  data: DayData[];
  onMonthChange: (year: number, month: number) => void;
}

export function FocusCalendar({ year, month, data, onMonthChange }: Props) {
  const router = useRouter();
  const { isDark, colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const todayStr = new Date().toISOString().slice(0, 10);
  const dataByDate = useMemo(() => new Map(data.map((d) => [d.date, d])), [data]);

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const { maxFocusSec, focusSecByDay } = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const byDay = new Map<string, number>();
    let max = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const sec = dayFocusSec(dataByDate.get(dateStr));
      byDay.set(dateStr, sec);
      if (sec > max) max = sec;
    }
    return { maxFocusSec: max, focusSecByDay: byDay };
  }, [year, month, daysInMonth, dataByDate]);

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
      <View style={styles.nav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.6}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[month - 1]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.6}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {DAY_LABELS.map((l, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dayLabel}>{l}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (day === null) {
              return <View key={di} style={styles.cell} />;
            }
            const pad = (n: number) => String(n).padStart(2, '0');
            const dateStr = `${year}-${pad(month)}-${pad(day)}`;
            const focusSec = focusSecByDay.get(dateStr) ?? 0;
            const level = maxFocusSec > 0 ? focusSec / maxFocusSec : focusSec > 0 ? 1 : 0;
            const isToday = dateStr === todayStr;

            return (
              <TouchableOpacity
                key={di}
                style={styles.cell}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.7}
                accessibilityLabel={`${dateStr}, ${formatFocusMinutes(focusSec)} focused`}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: getDotBgFromFocusLevel(level, isDark) },
                    isToday && [styles.dotToday, { borderColor: colors.pinkText }],
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>少</Text>
        {[0, 0.33, 0.66, 1].map((level) => (
          <View
            key={level}
            style={[styles.legendDot, { backgroundColor: getDotBgFromFocusLevel(level, isDark) }]}
          />
        ))}
        <Text style={styles.legendLabel}>多</Text>
        {maxFocusSec > 0 && (
          <Text style={styles.legendHint}>（依本月專注時間）</Text>
        )}
      </View>
    </View>
  );
}

const DOT = 28;
const CELL_H = 38;

function createStyles({ colors }: AppTheme) {
  return StyleSheet.create({
    container: { paddingHorizontal: 4, paddingBottom: 4 },
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      paddingHorizontal: 4,
    },
    navBtn: { padding: 6 },
    navArrow: { fontSize: 22, color: colors.inkSoft, fontWeight: '300' },
    monthTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink,
      letterSpacing: 0.2,
    },
    row: { flexDirection: 'row', marginBottom: 5 },
    cell: { flex: 1, alignItems: 'center', justifyContent: 'center', height: CELL_H },
    dayLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.inkFaint,
      letterSpacing: 0.5,
    },
    dot: {
      width: DOT,
      height: DOT,
      borderRadius: DOT / 2,
    },
    dotToday: {
      borderWidth: 2,
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
    legendLabel: { fontSize: 9, color: colors.inkFaint, letterSpacing: 0.3 },
    legendHint: { fontSize: 8, color: colors.inkFaint, marginLeft: 4, fontStyle: 'italic' },
  });
}
