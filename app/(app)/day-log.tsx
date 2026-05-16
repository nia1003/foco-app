/**
 * DayLogScreen — weekly session accordion
 * Params: weekStart (YYYY-MM-DD, Monday), focusDate (YYYY-MM-DD)
 * Swipe left → next week · Swipe right → prev week
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { getWeekSessions } from '@/services/focoService';
import { getMockCalendarData } from '@/data/mockData';
import type { DayData } from '@/types';

const WEEK_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MON_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PINK = Colors.pinkText;

function isoToMondayStr(dateStr: string): string {
  const d = new Date(dateStr);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function weekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  return `${MON_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MON_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function qualityColor(score: number): string {
  if (score >= 85) return '#5BAD6F';
  if (score >= 65) return '#4A8FD4';
  if (score >= 40) return '#C9961A';
  return '#8B8BAE';
}

function buildMockWeekData(weekStart: string): DayData[] {
  const monday = new Date(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const mock = getMockCalendarData(year, month);
    const found = mock.find((x) => x.date === dateStr);
    return found ?? { date: dateStr, session_count: 0, sessions: [] };
  });
}

export default function DayLogScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const params = useLocalSearchParams<{ weekStart?: string; focusDate?: string }>();

  const initialWeekStart = params.weekStart
    ? isoToMondayStr(params.weekStart)
    : isoToMondayStr(new Date().toISOString().slice(0, 10));

  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(params.focusDate ?? null);

  const fetchWeek = useCallback(async (ws: string) => {
    setLoading(true);
    try {
      if (userId) {
        const data = await getWeekSessions(userId, ws);
        setWeekData(data);
      } else {
        setWeekData(buildMockWeekData(ws));
      }
    } catch {
      setWeekData(buildMockWeekData(ws));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchWeek(weekStart); }, [weekStart]);

  // Use a ref so PanResponder (created once) always reads the latest weekStart
  const weekStartRef = useRef(weekStart);
  useEffect(() => { weekStartRef.current = weekStart; }, [weekStart]);

  const navPrev = () => {
    const d = new Date(weekStartRef.current);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().slice(0, 10));
    setExpanded(null);
  };
  const navNext = () => {
    const d = new Date(weekStartRef.current);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().slice(0, 10));
    setExpanded(null);
  };

  // Swipe gesture — inline ref reads to avoid stale closure
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 12,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60) {
          const d = new Date(weekStartRef.current);
          d.setDate(d.getDate() + 7);
          setWeekStart(d.toISOString().slice(0, 10));
          setExpanded(null);
        } else if (gs.dx > 60) {
          const d = new Date(weekStartRef.current);
          d.setDate(d.getDate() - 7);
          setWeekStart(d.toISOString().slice(0, 10));
          setExpanded(null);
        }
      },
    }),
  ).current;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <AppBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={navPrev} activeOpacity={0.6}>
            <Text style={styles.headerArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Week of {weekLabel(weekStart)}</Text>
          <TouchableOpacity onPress={navNext} activeOpacity={0.6}>
            <Text style={styles.headerArrow}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading…</Text>
        ) : (
          weekData.map((day, idx) => {
            const dayName = WEEK_DAYS[idx] ?? '';
            const isExpanded = expanded === day.date;
            const hasSessions = day.session_count > 0;

            return (
              <View key={day.date} style={styles.dayBlock}>
                {/* Day header row */}
                <TouchableOpacity
                  style={[styles.dayHeader, isExpanded && styles.dayHeaderExpanded]}
                  onPress={() => setExpanded(isExpanded ? null : day.date)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dayHeaderLeft}>
                    <Text style={[styles.dayName, hasSessions && styles.dayNameActive]}>
                      {dayName.toUpperCase()}
                    </Text>
                    <Text style={styles.dayDate}>{dateLabel(day.date)}</Text>
                  </View>
                  <View style={styles.dayHeaderRight}>
                    <Text style={[styles.sessionCount, hasSessions && { color: PINK }]}>
                      {hasSessions ? `${day.session_count} session${day.session_count > 1 ? 's' : ''}` : '—'}
                    </Text>
                    {hasSessions && (
                      <Text style={styles.chevron}>{isExpanded ? '›' : '›'}</Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded session list */}
                {isExpanded && hasSessions && (
                  <View style={styles.sessionList}>
                    {day.sessions.map((s) => (
                      <View key={s.id} style={styles.sessionCard}>
                        <View style={styles.sessionCardTop}>
                          <Text style={styles.sessionTitle} numberOfLines={1}>
                            {s.task_title ?? `${s.duration_min}m focus session`}
                          </Text>
                          {s.quality_score > 0 && (
                            <Text style={[styles.qualityBadge, { color: qualityColor(s.quality_score) }]}>
                              {s.quality_score}/100
                            </Text>
                          )}
                        </View>
                        <View style={styles.sessionCardBot}>
                          <Text style={styles.sessionMeta}>{s.duration_min}m</Text>
                          <Text style={styles.sessionDot}>·</Text>
                          <Text style={[styles.sessionXp, { color: PINK }]}>+{s.xp_earned} XP</Text>
                          {s.completed && (
                            <>
                              <Text style={styles.sessionDot}>·</Text>
                              <Text style={[styles.sessionCompleted, { color: Colors.success }]}>✓</Text>
                            </>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        <Text style={styles.swipeHint}>← swipe to navigate weeks →</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fbfaf7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backArrow: { fontSize: 22, color: Colors.ink },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 17,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  headerArrow: { fontSize: 22, color: Colors.inkSoft, fontWeight: '300' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 100 },

  loadingText: {
    textAlign: 'center',
    marginTop: 60,
    color: Colors.inkFaint,
    fontSize: 14,
  },

  dayBlock: { marginBottom: 4 },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  dayHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dayHeaderLeft: { gap: 2 },
  dayName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1.8,
  },
  dayNameActive: { color: Colors.ink },
  dayDate: { fontSize: 13, color: Colors.inkSoft },

  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionCount: { fontSize: 13, color: Colors.inkFaint },
  chevron: { fontSize: 16, color: Colors.inkFaint },

  sessionList: {
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 6,
    gap: 8,
  },

  sessionCard: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 12,
    padding: 13,
    gap: 5,
  },
  sessionCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sessionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  qualityBadge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sessionCardBot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionMeta: { fontSize: 12, color: Colors.inkSoft },
  sessionDot: { fontSize: 12, color: Colors.inkFaint },
  sessionXp: { fontSize: 12, fontWeight: '600' },
  sessionCompleted: { fontSize: 12, fontWeight: '700' },

  swipeHint: {
    textAlign: 'center',
    marginTop: 28,
    fontSize: 11,
    color: Colors.inkFaint,
    letterSpacing: 0.5,
  },
});
