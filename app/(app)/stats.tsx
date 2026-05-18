/**
 * StatsScreen — Focus analytics
 * - Line chart for Daily Focus Time
 * - Focus type: dominant DISC type + radar chart
 * - Recent sessions list
 */
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
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
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { getSessions } from '@/services/focoService';
import { mockSessions } from '@/data/mockData';
import { useSound } from '@/components/SoundProvider';
import type { SessionRecord } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
// scrollContent paddingHorizontal 18×2 + chartCard padding 22×2 = 80
const CHART_W = SCREEN_W - 80;

// ── DISC config ──────────────────────────────────────────────────
const DISC_COLOR: Record<string, string> = {
  conscientiousness: '#4A90E2',
  dominance: Colors.pinkText,
  steadiness: '#5BAD6F',
  influence: '#F5A623',
};

const DISC_ICON: Record<string, string> = {
  dominance:        '▲',
  influence:        '◆',
  steadiness:       '◉',
  conscientiousness:'◈',
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
function getLast7Days(): Date[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function dayLabel(d: Date): string {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
}

interface DayStat {
  date: Date;
  day: string;
  hours: number;
  sessions: number;
}

function buildWeekStats(sessions: SessionRecord[]): DayStat[] {
  return getLast7Days().map((date) => {
    const dayStart = date.getTime();
    const dayEnd = dayStart + 86_400_000;
    const daySessions = sessions.filter((s) => {
      const t = new Date(s.ended_at).getTime();
      return t >= dayStart && t < dayEnd;
    });
    const totalSec = daySessions.reduce((acc, s) => acc + s.actual_duration, 0);
    return {
      date,
      day: dayLabel(date),
      hours: Math.round((totalSec / 3600) * 10) / 10,
      sessions: daySessions.length,
    };
  });
}

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

function sessionTimeOfDay(isoStr: string): string {
  const h = new Date(isoStr).getHours();
  if (h < 6)  return '深夜';
  if (h < 12) return '早上';
  if (h < 17) return '下午';
  if (h < 21) return '傍晚';
  return '夜晚';
}

// ── Line Chart ───────────────────────────────────────────────────
function LineChart({
  weekStats,
  selectedDay,
  onSelect,
}: {
  weekStats: DayStat[];
  selectedDay: number;
  onSelect: (i: number) => void;
}) {
  const W = CHART_W;
  const H = 80;
  const PAD_TOP = 22;
  const PAD_X = 10;
  const innerW = W - PAD_X * 2;
  const svgH = H + PAD_TOP + 8;

  const MAX = Math.max(...weekStats.map((d) => d.hours), 0.1);

  const pts = weekStats.map((d, i) => ({
    x: PAD_X + (i / 6) * innerW,
    y: PAD_TOP + (1 - d.hours / MAX) * H,
  }));

  const polylineStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

  // Filled area: follow line, then close at bottom
  const areaStr = [
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[6].x},${PAD_TOP + H + 4}`,
    `${pts[0].x},${PAD_TOP + H + 4}`,
  ].join(' ');

  return (
    <View>
      <Svg width={W} height={svgH}>
        {/* Gradient-like area fill */}
        <Polygon points={areaStr} fill="rgba(242,206,220,0.30)" />

        {/* Line */}
        <Polyline
          points={polylineStr}
          fill="none"
          stroke={Colors.pinkHot}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {pts.map((p, i) =>
          i === selectedDay ? (
            <React.Fragment key={i}>
              <Circle cx={p.x} cy={p.y} r={12} fill="rgba(232,120,90,0.12)" />
              <Circle cx={p.x} cy={p.y} r={5.5} fill={Colors.pinkHot} />
            </React.Fragment>
          ) : (
            <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill="rgba(232,120,90,0.45)" />
          ),
        )}
      </Svg>

      {/* Tap targets + day labels */}
      <View style={lcStyles.dayRow}>
        {weekStats.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={lcStyles.dayBtn}
            onPress={() => onSelect(i)}
            activeOpacity={0.7}
          >
            <Text style={[lcStyles.dayLabel, i === selectedDay && lcStyles.dayLabelActive]}>
              {d.day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const lcStyles = StyleSheet.create({
  dayRow: { flexDirection: 'row', paddingHorizontal: 4, marginTop: 2 },
  dayBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayLabel: { fontSize: 11, color: Colors.inkFaint, fontWeight: '500' },
  dayLabelActive: { color: Colors.ink, fontWeight: '700' },
});

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

      {/* Icon labels */}
      {DISC_AXES.map(({ key, angle }) => {
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <SvgText
            key={key}
            x={lx}
            y={ly + 5}
            textAnchor="middle"
            fontSize={14}
            fill={DISC_COLOR[key] ?? '#888'}
            fontWeight="600"
          >
            {DISC_ICON[key]}
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
  const { play } = useSound();

  const { sessions, summary, isStale, setData } = useSessionStore();
  const hasData = sessions.length > 0 || summary.total_sessions > 0;
  const [fetching, setFetching] = useState(false);
  const [selectedDay, setSelectedDay] = useState(6); // default: today

  useEffect(() => {
    if (!userId) {
      setData({ sessions: mockSessions.sessions, summary: mockSessions.summary });
      return;
    }
    // Skip fetch if cache is still fresh
    if (hasData && !isStale()) return;

    setFetching(true);
    getSessions(userId)
      .then((res) => setData(res))
      .catch(() => { if (!hasData) setData({ sessions: mockSessions.sessions, summary: mockSessions.summary }); })
      .finally(() => setFetching(false));
  }, [userId]);

  const weekStats  = buildWeekStats(sessions);
  const discData   = buildDiscData(sessions);
  const dominant   = getDominantType(discData);

  const weekStart = weekStats[0]?.date;
  const weekEnd   = weekStats[6]?.date;
  const weekRangeStr =
    weekStart && weekEnd
      ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
      : '';

  const totalHours = Math.round((summary.total_focus_sec / 3600) * 10) / 10;
  const selected   = weekStats[selectedDay];

  // Show blank screen only on initial load with no cached data
  if (!hasData && fetching) {
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
        <Text style={styles.sub}>Week of {weekRangeStr}</Text>

        {/* ── Summary row ────────────────────────────── */}
        <View style={styles.summaryRow}>
          {[
            { v: `${totalHours}h`, l: 'Total' },
            { v: String(summary.total_sessions), l: 'Sessions' },
            { v: `${summary.streak_days}d`, l: 'Streak' },
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

        {/* ── Line chart ─────────────────────────────── */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Daily Focus Time</Text>
              <LineChart
                weekStats={weekStats}
                selectedDay={selectedDay}
                onSelect={setSelectedDay}
              />
              {selected && (
                <View style={styles.selectedDetail}>
                  <Text style={styles.selectedDetailText}>
                    {selected.sessions} session{selected.sessions !== 1 ? 's' : ''} · {selected.hours}h focused
                  </Text>
                </View>
              )}
            </View>
          </FrostCard>
        </View>

        {/* ── Focus type breakdown ────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => { play('tap'); router.push({ pathname: '/(app)/disc-detail', params: { dominant } }); }}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.breakdownCard}>
              <View style={styles.chartTitleRow}>
                <Text style={styles.chartTitle}>Focus type breakdown</Text>
                <Text style={styles.chartTitleChevron}>›</Text>
              </View>

              {/* Dominant type row */}
              <View style={styles.dominantRow}>
                <Text style={[styles.dominantEmoji, { color: DISC_COLOR[dominant] ?? '#888' }]}>
                  {DISC_ICON[dominant]}
                </Text>
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
          </TouchableOpacity>
        </View>

        {/* ── Recent sessions ─────────────────────────── */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <FrostCard radius={24} padded={false}>
              <View style={styles.recentCard}>
                <Text style={styles.chartTitle}>Recent sessions</Text>
                {sessions.slice(0, 5).map((s) => {
                  const mins = Math.floor(s.actual_duration / 60);
                  const refTime = s.started_at ?? s.ended_at;
                  const date = new Date(s.ended_at);
                  const dateStr = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
                  const timeOfDay = sessionTimeOfDay(refTime);
                  const tasksData = s.tasks;
                  const taskName = Array.isArray(tasksData)
                    ? (tasksData[0]?.title ?? null)
                    : (tasksData?.title ?? null);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.sessionRow}
                      onPress={() => {
                        play('tap');
                        router.push({
                          pathname: '/(app)/analysis',
                          params: {
                            result: JSON.stringify({
                              xp_gained: s.xp_earned,
                              actual_duration: s.actual_duration,
                              pause_count: s.pause_count ?? 0,
                              left_app_count: s.left_app_count ?? 0,
                              quality_score: s.quality_score ?? 0,
                              started_at: s.started_at,
                              task_title: taskName,
                            }),
                          },
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.sessionDot} />
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>
                          {taskName ?? `${mins}m focus`}
                        </Text>
                        <Text style={styles.sessionSub}>
                          {timeOfDay} · {dateStr} · {mins}m
                        </Text>
                      </View>
                      <View style={styles.sessionRight}>
                        <Text style={styles.sessionXP}>+{s.xp_earned}</Text>
                        <Text style={styles.sessionXPLabel}>XP</Text>
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
  sub: { fontSize: 13, color: Colors.inkSoft, marginTop: 4 },

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

  // Line chart card
  chartCard: { padding: 22, paddingTop: 26, overflow: 'visible' },
  chartTitle: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  chartTitleChevron: { fontSize: 20, color: Colors.inkFaint },
  selectedDetail: { marginTop: 10 },
  selectedDetailText: { fontSize: 12, color: Colors.inkSoft, textAlign: 'center' },

  // DISC breakdown card
  breakdownCard: { padding: 22, alignItems: 'center' },
  dominantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 8,
  },
  dominantEmoji: { fontSize: 28, fontWeight: '700' },
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
  sessionDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0, backgroundColor: 'rgba(20,16,28,0.18)' },
  sessionInfo: { flex: 1 },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
    textTransform: 'capitalize',
  },
  sessionSub: { fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end', gap: 1 },
  sessionXP: { fontSize: 14, fontWeight: '700', color: Colors.pinkText, letterSpacing: -0.3 },
  sessionXPLabel: { fontSize: 9, color: Colors.inkFaint, letterSpacing: 0.8 },
});
