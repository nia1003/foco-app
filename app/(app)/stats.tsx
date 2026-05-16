/**
 * StatsScreen — Focus analytics
 * - Line chart for Daily Focus Time
 * - Focus type: dominant DISC type + radar chart
 * - Recent sessions list
 */
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Line as SvgLine,
  Polygon,
  Polyline,
  Text as SvgText,
} from 'react-native-svg';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { MonthCalendar } from '@/components/MonthCalendar';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { getSessions } from '@/services/focoService';
import { mockSessions } from '@/data/mockData';
import type { SessionRecord } from '@/types';

// ── DISC config ──────────────────────────────────────────────────
const DISC_COLOR: Record<string, string> = {
  conscientiousness: '#4A90E2',
  dominance: Colors.pinkText,
  steadiness: '#5BAD6F',
  influence: '#F5A623',
};

const DISC_EMOJI: Record<string, string> = {
  dominance:        '☀️',
  influence:        '🌕',
  steadiness:       '🌏',
  conscientiousness:'🪐',
};

const DISC_LABEL: Record<string, string> = {
  dominance:        'Dominance',
  influence:        'Influence',
  steadiness:       'Steadiness',
  conscientiousness:'Conscientiousness',
};

const DISC_SUBLABEL: Record<string, string> = {
  dominance:        '主導型',
  influence:        '影響型',
  steadiness:       '穩健型',
  conscientiousness:'謹慎型',
};

// Axes in clockwise order starting from top
const DISC_AXES: { key: string; angle: number }[] = [
  { key: 'dominance',        angle: -Math.PI / 2 }, // top
  { key: 'influence',        angle: 0 },             // right
  { key: 'steadiness',       angle: Math.PI / 2 },   // bottom
  { key: 'conscientiousness',angle: Math.PI },        // left
];

// ── Data helpers ─────────────────────────────────────────────────
// Returns fraction (0–1) for each DISC type across all sessions
function buildDiscData(sessions: SessionRecord[]): Record<string, number> {
  const counts: Record<string, number> = {
    dominance: 0, influence: 0, steadiness: 0, conscientiousness: 0,
  };
  sessions.forEach((s) => {
    if (s.focus_type_result && s.focus_type_result in counts) {
      counts[s.focus_type_result]++;
    }
  });
  const total = sessions.length || 1;
  return Object.fromEntries(
    Object.entries(counts).map(([k, v]) => [k, v / total]),
  );
}

function getDominantType(data: Record<string, number>): string {
  const entries = Object.entries(data);
  if (entries.every(([, v]) => v === 0)) return 'steadiness';
  return entries.reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Radar Chart ──────────────────────────────────────────────────
function RadarChart({ data }: { data: Record<string, number> }) {
  const SIZE = 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 56;

  const gridLevels = [1 / 3, 2 / 3, 1];

  const gridPolygons = gridLevels.map((level) =>
    DISC_AXES.map(({ angle }) => {
      const r = level * R;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' '),
  );

  // Ensure at least a tiny shape even if all values are 0
  const dataPoints = DISC_AXES.map(({ key, angle }) => {
    const val = Math.max(data[key] ?? 0, 0.04);
    return {
      x: cx + val * R * Math.cos(angle),
      y: cy + val * R * Math.sin(angle),
    };
  });
  const polygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Emoji label positions (slightly beyond axis end)
  const labelR = R + 22;

  return (
    <Svg width={SIZE} height={SIZE}>
      {/* Grid rings */}
      {gridPolygons.map((pts, i) => (
        <Polygon key={i} points={pts} fill="none" stroke="rgba(20,16,28,0.08)" strokeWidth={1} />
      ))}

      {/* Axis lines */}
      {DISC_AXES.map(({ key, angle }) => (
        <SvgLine
          key={key}
          x1={cx} y1={cy}
          x2={cx + R * Math.cos(angle)}
          y2={cy + R * Math.sin(angle)}
          stroke="rgba(20,16,28,0.10)"
          strokeWidth={1}
        />
      ))}

      {/* Data fill */}
      <Polygon
        points={polygonPoints}
        fill="rgba(242,140,100,0.20)"
        stroke={Colors.pinkHot}
        strokeWidth={2}
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={Colors.pinkHot} />
      ))}

      {/* Emoji labels */}
      {DISC_AXES.map(({ key, angle }) => {
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <SvgText
            key={key}
            x={lx}
            y={ly + 6}          // +6 ≈ visual center for emoji
            textAnchor="middle"
            fontSize={18}
          >
            {DISC_EMOJI[key]}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ── Main Screen ──────────────────────────────────────────────────
export default function StatsScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [summary, setSummary] = useState({
    total_focus_sec: 0,
    streak_days: 0,
    total_sessions: 0,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDaySessions, setSelectedDaySessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    if (!userId) {
      setSessions(mockSessions.sessions);
      setSummary(mockSessions.summary);
      setLoading(false);
      return;
    }
    getSessions(userId)
      .then((res) => {
        setSessions(res.sessions);
        setSummary(res.summary);
      })
      .catch(() => {
        setSessions(mockSessions.sessions);
        setSummary(mockSessions.summary);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const discData   = buildDiscData(sessions);
  const dominant   = getDominantType(discData);
  const totalHours = Math.round((summary.total_focus_sec / 3600) * 10) / 10;

  function handleDayPress(date: Date, daySessions: SessionRecord[]) {
    setSelectedDate(date);
    setSelectedDaySessions(daySessions);
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <AppBackground />
        <FocoBar />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Stats</Text>

        {/* ── Summary row ────────────────────────────── */}
        <View style={styles.summaryRow}>
          {[
            { v: `${totalHours}h`, l: 'Total' },
            { v: String(summary.total_sessions), l: 'Sessions' },
            { v: `${summary.streak_days}🔥`, l: 'Streak' },
          ].map((s, i) => (
            <View key={i} style={styles.summaryCard}>
              <FrostCard radius={20} padded={false}>
                <View style={styles.summaryInner}>
                  <Text style={styles.summaryVal}>{s.v}</Text>
                  <Text style={styles.summaryLabel}>{s.l}</Text>
                </View>
              </FrostCard>
            </View>
          ))}
        </View>

        {/* ── Month Calendar ──────────────────────────── */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.chartCard}>
              <MonthCalendar
                sessions={sessions}
                selectedDate={selectedDate}
                onDayPress={handleDayPress}
              />
            </View>
          </FrostCard>
        </View>

        {/* ── Day detail panel ────────────────────────── */}
        {selectedDate && (
          <View style={styles.section}>
            <FrostCard radius={24} padded={false}>
              <View style={styles.dayDetailCard}>
                <Text style={styles.dayDetailTitle}>
                  {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
                </Text>
                {selectedDaySessions.length === 0 ? (
                  <Text style={styles.dayDetailEmpty}>這天沒有紀錄</Text>
                ) : (
                  selectedDaySessions.map((s) => {
                    const mins = Math.floor(s.actual_duration / 60);
                    const t = new Date(s.ended_at);
                    const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
                    const discColor = DISC_COLOR[s.focus_type_result ?? ''] ?? Colors.inkSoft;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={styles.sessionRow}
                        onPress={() =>
                          router.push({
                            pathname: '/(app)/analysis',
                            params: {
                              result: JSON.stringify({
                                focus_type: s.focus_type_result,
                                actual_duration: s.actual_duration,
                                pause_count: s.pause_count ?? 0,
                                left_app_count: s.left_app_count ?? 0,
                              }),
                            },
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <View style={[styles.sessionDot, { backgroundColor: discColor }]} />
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionTitle}>
                            {mins} min · {s.focus_type_result ?? 'unknown'}
                          </Text>
                          <Text style={styles.sessionSub}>{timeStr}</Text>
                        </View>
                        <View style={[styles.sessionBadge, !s.completed && styles.sessionBadgeInactive]}>
                          <Text style={[styles.sessionBadgeText, !s.completed && styles.sessionBadgeTextInactive]}>
                            {s.completed ? 'Done' : 'Early stop'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </FrostCard>
          </View>
        )}

        {/* ── Focus type breakdown ────────────────────── */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.breakdownCard}>
              <Text style={styles.chartTitle}>Focus type breakdown</Text>

              {/* Dominant type row */}
              <View style={styles.dominantRow}>
                <Text style={styles.dominantEmoji}>{DISC_EMOJI[dominant]}</Text>
                <View style={styles.dominantInfo}>
                  <Text style={styles.dominantLabel}>{DISC_LABEL[dominant]}</Text>
                  <Text style={styles.dominantSub}>{DISC_SUBLABEL[dominant]}</Text>
                </View>
                <View
                  style={[
                    styles.dominantBadge,
                    { backgroundColor: (DISC_COLOR[dominant] ?? Colors.pinkHot) + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.dominantBadgeText,
                      { color: DISC_COLOR[dominant] ?? Colors.pinkHot },
                    ]}
                  >
                    {Math.round((discData[dominant] ?? 0) * 100)}%
                  </Text>
                </View>
              </View>

              {/* Radar chart */}
              <View style={styles.radarWrapper}>
                <RadarChart data={discData} />
              </View>
            </View>
          </FrostCard>
        </View>

        {/* ── Recent sessions ─────────────────────────── */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <FrostCard radius={24} padded={false}>
              <View style={styles.recentCard}>
                <Text style={styles.chartTitle}>Recent sessions</Text>
                {sessions.slice(0, 5).map((s) => {
                  const mins = Math.floor(s.actual_duration / 60);
                  const date = new Date(s.ended_at);
                  const dateStr = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
                  const discColor = DISC_COLOR[s.focus_type_result ?? ''] ?? Colors.inkSoft;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.sessionRow}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/analysis',
                          params: {
                            result: JSON.stringify({
                              xp_gained: s.xp_earned,
                              focus_type: s.focus_type_result,
                              actual_duration: s.actual_duration,
                              pause_count: s.pause_count ?? 0,
                              left_app_count: s.left_app_count ?? 0,
                            }),
                          },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={[styles.sessionDot, { backgroundColor: discColor }]} />
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>
                          {mins} min · {s.focus_type_result ?? 'unknown'}
                        </Text>
                        <Text style={styles.sessionSub}>
                          {dateStr}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.sessionBadge,
                          !s.completed && styles.sessionBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sessionBadgeText,
                            !s.completed && styles.sessionBadgeTextInactive,
                          ]}
                        >
                          {s.completed ? 'Done' : 'Early stop'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </FrostCard>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },

  title: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 42,
    fontWeight: '500',
    color: Colors.ink,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  // Summary
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  summaryCard: { flex: 1 },
  summaryInner: { padding: 14 },
  summaryVal: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 6,
  },

  section: { marginTop: 12 },

  // Calendar card
  chartCard: { padding: 22, paddingTop: 22 },
  chartTitle: { fontSize: 14, fontWeight: '600', color: Colors.ink, marginBottom: 18 },

  // Day detail panel
  dayDetailCard: { padding: 22 },
  dayDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 12,
  },
  dayDetailEmpty: { fontSize: 13, color: Colors.inkFaint, textAlign: 'center', paddingVertical: 12 },

  // DISC breakdown card
  breakdownCard: { padding: 22, alignItems: 'center' },
  dominantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 8,
  },
  dominantEmoji: { fontSize: 34 },
  dominantInfo: { flex: 1 },
  dominantLabel: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  dominantSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  dominantBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  dominantBadgeText: { fontSize: 12, fontWeight: '700' },
  radarWrapper: { alignItems: 'center', marginTop: 4 },

  // Recent sessions
  recentCard: { padding: 22 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(20,16,28,0.08)',
  },
  sessionDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  sessionInfo: { flex: 1 },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
    textTransform: 'capitalize',
  },
  sessionSub: { fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
  sessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(242,206,220,0.50)',
  },
  sessionBadgeInactive: { backgroundColor: 'rgba(20,16,28,0.06)' },
  sessionBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.pinkText },
  sessionBadgeTextInactive: { color: Colors.inkFaint },
});
