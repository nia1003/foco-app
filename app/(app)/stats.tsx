import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Platform,
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
// AppBackground and FrostCard replaced with flat #EFE8E0 / #E6E6E6 styling
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { FocusCalendar } from '@/components/FocusCalendar';
import { getSessions, getCalendarData, getTasks } from '@/services/focoService';
import { mockSessions, getMockCalendarData, mockTasks } from '@/data/mockData';
import { usePetStore } from '@/stores/petStore';
import { useSound } from '@/components/SoundProvider';
import { ShareReceiptModal } from '@/components/share/ShareReceiptModal';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { usePreferencesStore } from '@/stores/preferencesStore';
import {
  createCategoryChartStyles,
  createLineChartLabelStyles,
  createStatsStyles,
} from '@/styles/statsScreen.styles';
import type { DayData, SessionRecord, Task, TaskCategory } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
// scrollContent paddingHorizontal 18×2 + chartCard padding 22×2 = 80
const CHART_W = SCREEN_W - 80;

// ── DISC config ──────────────────────────────────────────────────
// ── Brand palette ─────────────────────────────────────────────
const C_BLUE   = '#B5E0FF';
const C_PURPLE = '#ECC5FE';
const C_LIME   = '#E6FF97';
const C_PINK   = '#FFC9EF';

const DISC_COLOR: Record<string, string> = {
  conscientiousness: C_BLUE,
  dominance:         C_PURPLE,
  steadiness:        C_LIME,
  influence:         C_PINK,
};

const DISC_ICON: Record<string, string> = {
  dominance: '▲',
  influence: '◆',
  steadiness: '◉',
  conscientiousness: '◈',
};

const DISC_LABEL: Record<string, string> = {
  dominance: 'Dominance',
  influence: 'Influence',
  steadiness: 'Steadiness',
  conscientiousness: 'Conscientiousness',
};

const DISC_SUBLABEL: Record<string, string> = {
  dominance: '主導型',
  influence: '影響型',
  steadiness: '穩健型',
  conscientiousness: '謹慎型',
};

// Axes in clockwise order starting from top
const DISC_AXES: { key: string; angle: number }[] = [
  { key: 'dominance', angle: -Math.PI / 2 }, // top
  { key: 'influence', angle: 0 }, // right
  { key: 'steadiness', angle: Math.PI / 2 }, // bottom
  { key: 'conscientiousness', angle: Math.PI }, // left
];

// ── Data helpers ─────────────────────────────────────────────────
type PeriodMode = 'day' | 'week' | 'month';

const WEEKLY_POINTS = 6;
const MONTHLY_POINTS = 6;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
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

function aggregateSessions(
  sessions: SessionRecord[],
  rangeStart: number,
  rangeEnd: number,
): { hours: number; sessions: number } {
  const inRange = sessions.filter((s) => {
    const t = new Date(s.ended_at).getTime();
    return t >= rangeStart && t < rangeEnd;
  });
  const totalSec = inRange.reduce((acc, s) => acc + s.actual_duration, 0);
  return {
    hours: Math.round((totalSec / 3600) * 10) / 10,
    sessions: inRange.length,
  };
}

function getDailyRange(anchorEnd: Date): Date[] {
  const end = startOfDay(anchorEnd);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

function getWeeklyRanges(
  anchorEnd: Date,
  count: number,
): { start: Date; end: Date }[] {
  const end = startOfDay(anchorEnd);
  return Array.from({ length: count }, (_, i) => {
    const weekEnd = new Date(end);
    weekEnd.setDate(weekEnd.getDate() - (count - 1 - i) * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    return { start: weekStart, end: weekEnd };
  });
}

function getMonthlyRanges(
  anchorEnd: Date,
  count: number,
): { year: number; month: number }[] {
  const anchor = new Date(anchorEnd.getFullYear(), anchorEnd.getMonth(), 1);
  return Array.from({ length: count }, (_, i) => {
    const m = new Date(
      anchor.getFullYear(),
      anchor.getMonth() - (count - 1 - i),
      1,
    );
    return { year: m.getFullYear(), month: m.getMonth() };
  });
}

function buildChartStats(
  sessions: SessionRecord[],
  mode: PeriodMode,
  anchorEnd: Date,
): DayStat[] {
  if (mode === 'day') {
    return getDailyRange(anchorEnd).map((date) => {
      const dayStart = date.getTime();
      const agg = aggregateSessions(sessions, dayStart, dayStart + 86_400_000);
      return { date, day: dayLabel(date), ...agg };
    });
  }

  if (mode === 'week') {
    return getWeeklyRanges(anchorEnd, WEEKLY_POINTS).map(({ start, end }) => {
      const agg = aggregateSessions(
        sessions,
        start.getTime(),
        end.getTime() + 86_400_000,
      );
      return {
        date: end,
        day: `${start.getMonth() + 1}/${start.getDate()}`,
        ...agg,
      };
    });
  }

  return getMonthlyRanges(anchorEnd, MONTHLY_POINTS).map(({ year, month }) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    const agg = aggregateSessions(sessions, start.getTime(), end.getTime());
    return {
      date: start,
      day: MONTHS[month],
      ...agg,
    };
  });
}

function formatChartPeriod(mode: PeriodMode, anchorEnd: Date): string {
  if (mode === 'day') {
    const days = getDailyRange(anchorEnd);
    const first = days[0];
    const last = days[6];
    return `${
      MONTHS[first.getMonth()]
    } ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
  }
  if (mode === 'week') {
    const ranges = getWeeklyRanges(anchorEnd, WEEKLY_POINTS);
    const first = ranges[0].start;
    const last = ranges[ranges.length - 1].end;
    return `${
      MONTHS[first.getMonth()]
    } ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
  }
  const ranges = getMonthlyRanges(anchorEnd, MONTHLY_POINTS);
  const first = ranges[0];
  const last = ranges[ranges.length - 1];
  return `${MONTHS[first.month]} ${first.year} – ${MONTHS[last.month]} ${
    last.year
  }`;
}

function shiftChartAnchor(
  anchor: Date,
  mode: PeriodMode,
  direction: -1 | 1,
): Date {
  const d = new Date(anchor);
  if (mode === 'day') d.setDate(d.getDate() + direction * 7);
  else if (mode === 'week')
    d.setDate(d.getDate() + direction * WEEKLY_POINTS * 7);
  else d.setMonth(d.getMonth() + direction * MONTHLY_POINTS);
  return d;
}

function isAnchorInFuture(anchor: Date, mode: PeriodMode): boolean {
  const today = startOfDay(new Date());
  const shifted = shiftChartAnchor(anchor, mode, 1);
  return startOfDay(shifted) > today;
}

// Returns fraction (0–1) for each DISC type across all sessions
function buildDiscData(sessions: SessionRecord[]): Record<string, number> {
  const counts: Record<string, number> = {
    dominance: 0,
    influence: 0,
    steadiness: 0,
    conscientiousness: 0,
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

type CategoryStat = {
  key: string;
  label: string;
  hours: number;
  pct: number;
  color: string;
};
type FocusGroupMode = 'category' | 'task';

const TASK_NAME_COLORS = [
  C_PURPLE, C_BLUE, C_LIME, C_PINK,
  '#D4AAFE', '#91CFFF', '#CFFF6E', '#FFAADE',
];

function resolveSessionTaskLabel(
  s: SessionRecord,
  taskMap: Map<string, Task>,
): string {
  if (s.task_id) {
    const t = taskMap.get(s.task_id);
    if (t) return t.emoji ? `${t.emoji} ${t.title}` : t.title;
  }
  const tasksData = s.tasks;
  if (Array.isArray(tasksData) && tasksData[0]?.title)
    return tasksData[0].title;
  if (tasksData && typeof tasksData === 'object' && 'title' in tasksData) {
    return (tasksData as { title: string }).title;
  }
  return 'Free focus';
}

function normalizeTaskGroupKey(title: string): string {
  return title.trim().toLowerCase();
}

function buildCategoryFocusStats(
  sessions: SessionRecord[],
  tasks: Task[],
): CategoryStat[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  let taskSec = 0;
  let dailySec = 0;
  let freeSec = 0;

  sessions.forEach((s) => {
    const sec = s.actual_duration ?? 0;
    if (!s.task_id) {
      freeSec += sec;
      return;
    }
    const cat: TaskCategory = taskMap.get(s.task_id)?.category ?? 'task';
    if (cat === 'daily') dailySec += sec;
    else taskSec += sec;
  });

  const total = taskSec + dailySec + freeSec || 1;
  return [
    {
      key: 'task',
      label: 'Task',
      hours: taskSec / 3600,
      pct: taskSec / total,
      color: C_BLUE,
    },
    {
      key: 'daily',
      label: 'Daily',
      hours: dailySec / 3600,
      pct: dailySec / total,
      color: C_PURPLE,
    },
    {
      key: 'free',
      label: 'Free focus',
      hours: freeSec / 3600,
      pct: freeSec / total,
      color: C_LIME,
    },
  ];
}

function buildTaskNameFocusStats(
  sessions: SessionRecord[],
  tasks: Task[],
): CategoryStat[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const buckets = new Map<string, { label: string; sec: number }>();

  sessions.forEach((s) => {
    const sec = s.actual_duration ?? 0;
    if (sec <= 0) return;
    const label = resolveSessionTaskLabel(s, taskMap);
    const key = normalizeTaskGroupKey(label);
    const existing = buckets.get(key);
    if (existing) {
      existing.sec += sec;
    } else {
      buckets.set(key, { label, sec });
    }
  });

  const total = [...buckets.values()].reduce((acc, b) => acc + b.sec, 0);
  if (total <= 0) return [];

  const sorted = [...buckets.entries()].sort((a, b) => b[1].sec - a[1].sec);
  const top = sorted.slice(0, 7);
  const restSec = sorted.slice(7).reduce((acc, [, b]) => acc + b.sec, 0);
  const entries =
    restSec > 0
      ? [...top, ['__other__', { label: 'Other', sec: restSec }] as const]
      : top;

  return entries.map(([key, { label, sec }], i) => ({
    key,
    label,
    hours: sec / 3600,
    pct: sec / total,
    color: TASK_NAME_COLORS[i % TASK_NAME_COLORS.length],
  }));
}

function CategoryBarChart({
  stats,
  emptyText = '尚無專注紀錄',
}: {
  stats: CategoryStat[];
  emptyText?: string;
}) {
  const catChartStyles = useThemedStyles(createCategoryChartStyles);
  if (stats.length === 0) {
    return <Text style={catChartStyles.empty}>{emptyText}</Text>;
  }
  const maxHours = Math.max(...stats.map((s) => s.hours), 0.25);
  return (
    <View style={catChartStyles.wrap}>
      {stats.map((s) => (
        <View key={s.key} style={catChartStyles.row}>
          <View style={catChartStyles.labelCol}>
            <Text style={catChartStyles.label} numberOfLines={2}>
              {s.label}
            </Text>
            <Text style={catChartStyles.sub}>
              {Math.round(s.hours * 10) / 10}h · {Math.round(s.pct * 100)}%
            </Text>
          </View>
          <View style={catChartStyles.barTrack}>
            <View
              style={[
                catChartStyles.barFill,
                {
                  width: `${Math.max(
                    (s.hours / maxHours) * 100,
                    s.hours > 0 ? 8 : 0,
                  )}%` as `${number}%`,
                  backgroundColor: s.color,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function getDominantType(data: Record<string, number>): string {
  const entries = Object.entries(data);
  if (entries.every(([, v]) => v === 0)) return 'steadiness';
  return entries.reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
}

function sessionTimeOfDay(isoStr: string): string {
  const h = new Date(isoStr).getHours();
  if (h < 6) return '深夜';
  if (h < 12) return '早上';
  if (h < 17) return '下午';
  if (h < 21) return '傍晚';
  return '夜晚';
}

// ── Line Chart ───────────────────────────────────────────────────
function LineChart({
  chartStats,
  selectedIndex,
  onSelect,
}: {
  chartStats: DayStat[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  const { colors, isDark } = useAppTheme();
  const lcStyles = useThemedStyles(createLineChartLabelStyles);
  const W = CHART_W;
  const H = 80;
  const PAD_TOP = 22;
  const PAD_X = 10;
  const innerW = W - PAD_X * 2;
  const svgH = H + PAD_TOP + 8;
  const n = chartStats.length;

  if (n === 0) return null;

  const MAX = Math.max(...chartStats.map((d) => d.hours), 0.1);
  const xDivisor = Math.max(n - 1, 1);

  const pts = chartStats.map((d, i) => ({
    x: PAD_X + (i / xDivisor) * innerW,
    y: PAD_TOP + (1 - d.hours / MAX) * H,
  }));

  const polylineStr = pts.map((p) => `${p.x},${p.y}`).join(' ');

  const areaStr = [
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[n - 1].x},${PAD_TOP + H + 4}`,
    `${pts[0].x},${PAD_TOP + H + 4}`,
  ].join(' ');

  return (
    <View>
      <Svg width={W} height={svgH}>
        {/* Gradient-like area fill */}
        <Polygon
          points={areaStr}
          fill="rgba(236,197,254,0.25)"
        />

        <Polyline
          points={polylineStr}
          fill="none"
          stroke={C_PURPLE}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {pts.map((p, i) =>
          i === selectedIndex ? (
            <React.Fragment key={i}>
              <Circle cx={p.x} cy={p.y} r={12} fill="rgba(236,197,254,0.20)" />
              <Circle cx={p.x} cy={p.y} r={5.5} fill={C_PURPLE} />
            </React.Fragment>
          ) : (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill="rgba(236,197,254,0.60)"
            />
          ),
        )}
      </Svg>

      {/* Tap targets + day labels */}
      <View style={lcStyles.dayRow}>
        {chartStats.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={lcStyles.dayBtn}
            onPress={() => onSelect(i)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                lcStyles.dayLabel,
                i === selectedIndex && lcStyles.dayLabelActive,
              ]}
            >
              {d.day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

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
        <Polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(20,16,28,0.08)"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {DISC_AXES.map(({ key, angle }) => (
        <SvgLine
          key={key}
          x1={cx}
          y1={cy}
          x2={cx + R * Math.cos(angle)}
          y2={cy + R * Math.sin(angle)}
          stroke="rgba(20,16,28,0.10)"
          strokeWidth={1}
        />
      ))}

      {/* Data fill */}
      <Polygon
        points={polygonPoints}
        fill="rgba(236,197,254,0.30)"
        stroke={C_PURPLE}
        strokeWidth={2}
      />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={C_PURPLE} />
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
  const { screenBg } = useAppTheme();
  const styles = useThemedStyles(createStatsStyles);
  const { userId, userName, userEmail } = useAuthStore();
  const { activePet } = usePetStore();
  const { play } = useSound();
  const avatarUri = usePreferencesStore((s) => s.avatarUri);
  const displayName = userName ?? userEmail?.split('@')[0] ?? '?';
  const settingsAvatar = displayName[0]?.toUpperCase() ?? '?';

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState({
    total_focus_sec: 0,
    streak_days: 0,
    total_sessions: 0,
  });
  const [periodMode, setPeriodMode] = useState<PeriodMode>('day');
  const [chartAnchor, setChartAnchor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(6);
  const [shareOpen, setShareOpen] = useState(false);
  const [focusGroupMode, setFocusGroupMode] =
    useState<FocusGroupMode>('category');

  const nowDate = new Date();
  const [calYear, setCalYear] = useState(nowDate.getFullYear());
  const [calMonth, setCalMonth] = useState(nowDate.getMonth() + 1);
  const [calData, setCalData] = useState<DayData[]>([]);

  useEffect(() => {
    if (!userId) {
      setSessions(mockSessions.sessions);
      setSummary(mockSessions.summary);
      const demoDone: Task = {
        id: 't-demo-today',
        user_id: 'mock-user-001',
        title: 'focus for data structure exam',
        duration_min: 50,
        status: 'done',
        created_at: new Date().toISOString(),
      };
      setTasks([
        ...mockTasks.tasks.filter((t) => t.status !== 'deleted'),
        demoDone,
      ]);
      setLoading(false);
      return;
    }
    Promise.all([getSessions(userId), getTasks(userId)])
      .then(([sessionRes, taskRes]) => {
        setSessions(sessionRes.sessions);
        setSummary(sessionRes.summary);
        setTasks(taskRes.tasks);
      })
      .catch(() => {
        setSessions(mockSessions.sessions);
        setSummary(mockSessions.summary);
        setTasks(mockTasks.tasks);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCalData(getMockCalendarData(calYear, calMonth));
      return;
    }
    getCalendarData(userId, calYear, calMonth)
      .then(setCalData)
      .catch(() => setCalData(getMockCalendarData(calYear, calMonth)));
  }, [userId, calYear, calMonth]);

  const handleMonthChange = (y: number, m: number) => {
    setCalYear(y);
    setCalMonth(m);
  };

  const chartStats = buildChartStats(sessions, periodMode, chartAnchor);
  const chartPeriodLabel = formatChartPeriod(periodMode, chartAnchor);
  const chartForwardDisabled = isAnchorInFuture(chartAnchor, periodMode);

  const discData = buildDiscData(sessions);
  const dominant = getDominantType(discData);
  const focusGroupStats = useMemo(
    () =>
      focusGroupMode === 'category'
        ? buildCategoryFocusStats(sessions, tasks)
        : buildTaskNameFocusStats(sessions, tasks),
    [sessions, tasks, focusGroupMode],
  );

  const totalHours = Math.round((summary.total_focus_sec / 3600) * 10) / 10;
  const selected = chartStats[selectedDay];

  const handlePeriodMode = (mode: PeriodMode) => {
    setPeriodMode(mode);
    setChartAnchor(new Date());
    const pointCount =
      mode === 'day' ? 7 : mode === 'week' ? WEEKLY_POINTS : MONTHLY_POINTS;
    setSelectedDay(pointCount - 1);
  };

  const handleChartBack = () => {
    setChartAnchor((prev) => shiftChartAnchor(prev, periodMode, -1));
    setSelectedDay((prev) =>
      Math.min(
        prev,
        (periodMode === 'day'
          ? 7
          : periodMode === 'week'
          ? WEEKLY_POINTS
          : MONTHLY_POINTS) - 1,
      ),
    );
  };

  const handleChartForward = () => {
    if (chartForwardDisabled) return;
    setChartAnchor((prev) => shiftChartAnchor(prev, periodMode, 1));
    setSelectedDay((prev) =>
      Math.min(
        prev,
        (periodMode === 'day'
          ? 7
          : periodMode === 'week'
          ? WEEKLY_POINTS
          : MONTHLY_POINTS) - 1,
      ),
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <FocoBar avatar={settingsAvatar} avatarUri={avatarUri} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FocoBar avatar={settingsAvatar} avatarUri={avatarUri} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.sub}>{chartPeriodLabel}</Text>

        {/* ── Summary row ────────────────────────────── */}
        <View style={styles.summaryRow}>
          {[
            { v: `${totalHours}h`, l: 'Total' },
            { v: String(summary.total_sessions), l: 'Sessions' },
            { v: `${summary.streak_days}d`, l: 'Streak' },
          ].map((s, i) => (
            <View key={i} style={styles.summaryCard}>
              <View style={styles.flatCard}>
                <View style={styles.summaryInner}>
                  <Text style={styles.summaryVal}>{s.v}</Text>
                  <Text style={styles.summaryLabel}>{s.l}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── Focus Calendar (from Home) ─────────────── */}
        <View style={styles.section}>
          <Text style={styles.calEyebrow}>FOCUS HISTORY</Text>
          <View style={styles.flatCard}>
            <View style={styles.calInner}>
              <FocusCalendar
                year={calYear}
                month={calMonth}
                data={calData}
                onMonthChange={handleMonthChange}
              />
            </View>
          </View>
        </View>

        {/* ── Line chart ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.flatCard}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Daily Focus Time</Text>

              <View style={styles.periodModes}>
                {(
                  [
                    { key: 'day' as const, label: 'Daily' },
                    { key: 'week' as const, label: 'Weekly' },
                    { key: 'month' as const, label: 'Monthly' },
                  ] as const
                ).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => handlePeriodMode(key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.periodModeLabel,
                        periodMode === key && styles.periodModeLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.chartNav}>
                <TouchableOpacity
                  onPress={handleChartBack}
                  style={styles.chartNavBtn}
                  activeOpacity={0.6}
                >
                  <Text style={styles.chartNavArrow}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.chartPeriodLabel}>{chartPeriodLabel}</Text>
                <TouchableOpacity
                  onPress={handleChartForward}
                  style={styles.chartNavBtn}
                  activeOpacity={0.6}
                  disabled={chartForwardDisabled}
                >
                  <Text
                    style={[
                      styles.chartNavArrow,
                      chartForwardDisabled && styles.chartNavArrowDisabled,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              </View>

              <LineChart
                chartStats={chartStats}
                selectedIndex={selectedDay}
                onSelect={setSelectedDay}
              />
              {selected && (
                <View style={styles.selectedDetail}>
                  <Text style={styles.selectedDetailText}>
                    {selected.sessions} session
                    {selected.sessions !== 1 ? 's' : ''} · {selected.hours}h
                    focused
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Focus by task category ─────────────────── */}
        <View style={styles.section}>
          <View style={styles.flatCard}>
            <View style={[styles.breakdownCard, styles.breakdownCardStretch]}>
              <Text style={[styles.chartTitle, styles.chartTitleLeft]}>
                Focus Breakdown
              </Text>
              <View style={styles.periodModes}>
                {(
                  [
                    { key: 'category' as const, label: 'Category' },
                    { key: 'task' as const, label: 'Task' },
                  ] as const
                ).map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      play('tap');
                      setFocusGroupMode(key);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.periodModeLabel,
                        focusGroupMode === key && styles.periodModeLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <CategoryBarChart
                stats={focusGroupStats}
                emptyText="No focus data yet"
              />
            </View>
          </View>
        </View>

        {/* ── Focus type breakdown ────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              play('tap');
              router.push({
                pathname: '/(app)/disc-detail',
                params: { dominant },
              });
            }}
          >
            <View style={styles.flatCard}>
              <View style={styles.breakdownCard}>
                <View style={styles.chartTitleRow}>
                  <Text style={styles.chartTitle}>Focus type breakdown</Text>
                  <Text style={styles.chartTitleChevron}>›</Text>
                </View>

                {/* Dominant type row */}
                <View style={styles.dominantRow}>
                  <Text
                    style={[
                      styles.dominantEmoji,
                      { color: DISC_COLOR[dominant] ?? '#888' },
                    ]}
                  >
                    {DISC_ICON[dominant]}
                  </Text>
                  <View style={styles.dominantInfo}>
                    <Text style={styles.dominantLabel}>
                      {DISC_LABEL[dominant]}
                    </Text>
                    <Text style={styles.dominantSub}>
                      {DISC_SUBLABEL[dominant]}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.dominantBadge,
                      {
                        backgroundColor:
                          (DISC_COLOR[dominant] ?? C_PURPLE) + '22',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dominantBadgeText,
                        { color: DISC_COLOR[dominant] ?? C_PURPLE },
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
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Recent sessions ─────────────────────────── */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.flatCard}>
              <View style={styles.recentCard}>
                <Text style={styles.chartTitle}>Recent sessions</Text>
                {sessions.slice(0, 5).map((s) => {
                  const mins = Math.floor(s.actual_duration / 60);
                  const refTime = s.started_at ?? s.ended_at;
                  const date = new Date(s.ended_at);
                  const dateStr = `${
                    MONTHS[date.getMonth()]
                  } ${date.getDate()}`;
                  const timeOfDay = sessionTimeOfDay(refTime);
                  const tasksData = s.tasks;
                  const taskName = Array.isArray(tasksData)
                    ? tasksData[0]?.title ?? null
                    : tasksData?.title ?? null;
                  return (
                    <View key={s.id} style={styles.sessionRow}>
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
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.shareOpenBtn}
          onPress={() => {
            play('tap');
            setShareOpen(true);
          }}
          activeOpacity={0.88}
        >
          <Text style={styles.shareOpenBtnText}>Share</Text>
        </TouchableOpacity>
      </ScrollView>

      <ShareReceiptModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        sessions={sessions}
        tasks={tasks}
        userName={userName}
        userEmail={userEmail}
        petLevel={activePet?.level}
      />
    </View>
  );
}
