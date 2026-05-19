/**
 * Focus session share card (interface A) — same visual as analysis screen card.
 */
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Line as SvgLine,
  Polygon,
  Rect,
} from 'react-native-svg';
import type { SessionEvent } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_CARD_W = SCREEN_W - 64;
const OVERLAY_H = 52;

const QUALITY_LEVELS = [
  {
    min: 85,
    gradient: ['#0f1923', '#162538', '#0c2040'] as const,
    accent: '#4A8FD4',
    tagline: 'Exceptional. Every second earned.',
  },
  {
    min: 65,
    gradient: ['#0a1a10', '#112b18', '#0d3320'] as const,
    accent: '#5BAD6F',
    tagline: 'Strong session. Momentum building.',
  },
  {
    min: 40,
    gradient: ['#1a1500', '#2d2500', '#3c2f00'] as const,
    accent: '#C9961A',
    tagline: 'Steady progress. Keep the streak.',
  },
  {
    min: 0,
    gradient: ['#141218', '#1e1a24', '#18151e'] as const,
    accent: '#8B8BAE',
    tagline: 'Every session shapes the habit.',
  },
] as const;

function getLevel(score: number) {
  return QUALITY_LEVELS.find((l) => score >= l.min) ?? QUALITY_LEVELS[QUALITY_LEVELS.length - 1];
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${months[d.getMonth()]} ${d.getDate()} · ${h}:${m}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

type SegmentType = 'focus' | 'pause' | 'left_app';

interface Segment {
  type: SegmentType;
  widthPct: number;
}

function buildSegments(events: SessionEvent[], startedAt: string, totalSec: number): Segment[] {
  if (!events?.length || totalSec <= 0) return [{ type: 'focus', widthPct: 100 }];
  const startMs = new Date(startedAt).getTime();
  const totalMs = totalSec * 1000;
  const endMs = startMs + totalMs;
  const filtered = events
    .filter((e) => e.at >= startMs && e.at <= endMs)
    .sort((a, b) => a.at - b.at);
  const segs: Segment[] = [];
  let cursor = startMs;
  let cur: SegmentType = 'focus';
  for (const ev of filtered) {
    const dur = ev.at - cursor;
    if (dur > 500) segs.push({ type: cur, widthPct: (dur / totalMs) * 100 });
    cursor = ev.at;
    if (ev.type === 'pause') cur = 'pause';
    if (ev.type === 'resume') cur = 'focus';
    if (ev.type === 'left_app') cur = 'left_app';
    if (ev.type === 'returned') cur = 'focus';
  }
  const rem = endMs - cursor;
  if (rem > 500) segs.push({ type: cur, widthPct: (rem / totalMs) * 100 });
  return segs.length ? segs : [{ type: 'focus', widthPct: 100 }];
}

function segColor(type: SegmentType, accent: string): string {
  if (type === 'focus') return accent;
  if (type === 'pause') return 'rgba(0,0,0,0.12)';
  return 'rgba(220,50,50,0.40)';
}

function ClockIcon({ size = 15, color = '#333' }: { size?: number; color?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1.5;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1.3} />
      <SvgLine x1={cx} y1={cy} x2={cx} y2={cy - r * 0.55} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <SvgLine x1={cx} y1={cy} x2={cx + r * 0.45} y2={cy} stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  );
}

function BarsIcon({ size = 15, color = '#333' }: { size?: number; color?: string }) {
  const bw = size * 0.18;
  const gap = size * 0.1;
  const hs = [size * 0.38, size * 0.58, size * 0.76];
  const total = 3 * bw + 2 * gap;
  const sx = (size - total) / 2;
  const base = size * 0.86;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {hs.map((h, i) => (
        <Rect
          key={i}
          x={sx + i * (bw + gap)}
          y={base - h}
          width={bw}
          height={h}
          rx={0.6}
          fill={color}
          opacity={0.35 + i * 0.28}
        />
      ))}
    </Svg>
  );
}

function DiamondIcon({ size = 15, color = '#333' }: { size?: number; color?: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const hw = size * 0.38;
  const hh = size * 0.44;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Polygon
        points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StatCol({
  icon,
  value,
  label,
  accent,
}: {
  icon: 'clock' | 'bars' | 'diamond';
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={colStyles.col}>
      {icon === 'clock' && <ClockIcon size={14} color={accent} />}
      {icon === 'bars' && <BarsIcon size={14} color={accent} />}
      {icon === 'diamond' && <DiamondIcon size={14} color={accent} />}
      <Text style={colStyles.value}>{value}</Text>
      <Text style={colStyles.label}>{label}</Text>
    </View>
  );
}

export interface SessionShareCardProps {
  qualityScore: number;
  duration: number;
  pauses: number;
  leftApp: number;
  startedAt: string;
  taskTitle?: string | null;
  events?: SessionEvent[];
  cardWidth?: number;
  showOverlayShare?: boolean;
  onOverlayShare?: () => void;
}

export function SessionShareCard({
  qualityScore,
  duration,
  pauses,
  leftApp,
  startedAt,
  taskTitle,
  events = [],
  cardWidth = DEFAULT_CARD_W,
  showOverlayShare = false,
  onOverlayShare,
}: SessionShareCardProps) {
  const level = getLevel(qualityScore);
  const dateTime = formatDateTime(startedAt);
  const segments = buildSegments(events, startedAt, duration);
  const hasTimeline = events.length > 0;
  const heroH = Math.round(cardWidth * 0.58);

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <LinearGradient
        colors={level.gradient}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.hero, { height: heroH }]}
      >
        <View style={[styles.heroCenter, { bottom: OVERLAY_H }]}>
          <Text style={[styles.heroScore, { color: level.accent }]}>{qualityScore}</Text>
          <Text style={styles.heroScoreSub}>/100</Text>
        </View>

        <View style={styles.heroTop}>
          <Text style={styles.heroBrand}>FOCO</Text>
          <View style={[styles.timeChip, { borderColor: level.accent + '40' }]}>
            <Text style={[styles.timeChipText, { color: level.accent }]}>{dateTime}</Text>
          </View>
        </View>

        <View style={[styles.overlayStrip, { height: OVERLAY_H }]}>
          <Text style={styles.overlayTitle}>Focus Complete</Text>
          {showOverlayShare && onOverlayShare ? (
            <TouchableOpacity style={styles.overlayPill} onPress={onOverlayShare} activeOpacity={0.8}>
              <Text style={styles.overlayPillText}>Share ↗</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.overlayPillPlaceholder} />
          )}
        </View>
      </LinearGradient>

      <View style={styles.dataSection}>
        <View style={styles.qualityBlock}>
          <View style={styles.qualityTrack}>
            <View
              style={[
                styles.qualityFill,
                { width: `${qualityScore}%` as any, backgroundColor: level.accent },
              ]}
            />
          </View>
          <Text style={styles.qualityCaption}>專注品質</Text>
        </View>

        <View style={styles.hairline} />
        <Text style={styles.tagline}>{level.tagline}</Text>

        {taskTitle ? (
          <View style={styles.taskRow}>
            <Text style={[styles.taskCheck, { color: level.accent }]}>✓</Text>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {taskTitle}
            </Text>
          </View>
        ) : null}

        {hasTimeline && (
          <View style={styles.timelineBlock}>
            <View style={styles.timelineBar}>
              {segments.map((seg, i) => (
                <View
                  key={i}
                  style={[
                    styles.timelineSeg,
                    {
                      width: `${seg.widthPct}%` as any,
                      backgroundColor: segColor(seg.type, level.accent),
                      borderRadius: i === 0 || i === segments.length - 1 ? 3 : 0,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.hairline} />

        <View style={styles.statsRow}>
          <StatCol icon="clock" value={formatDuration(duration)} label="Duration" accent={level.accent} />
          <View style={styles.colDivider} />
          <StatCol icon="bars" value={`${pauses}`} label="Pauses" accent={level.accent} />
          <View style={styles.colDivider} />
          <StatCol icon="diamond" value={`${leftApp}`} label="Left App" accent={level.accent} />
        </View>

        <Text style={styles.cardFooter}>foco.app</Text>
      </View>
    </View>
  );
}

const colStyles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 15, fontWeight: '700', color: 'rgba(0,0,0,0.80)', letterSpacing: -0.3 },
  label: { fontSize: 9, color: 'rgba(0,0,0,0.35)', letterSpacing: 0.8, textTransform: 'uppercase' },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  hero: { paddingHorizontal: 20, paddingTop: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBrand: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 15,
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 2.5,
  },
  timeChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  timeChipText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  heroCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroScore: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 72,
    letterSpacing: -3,
    lineHeight: 80,
    includeFontPadding: false,
  },
  heroScoreSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.38)',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: -4,
  },
  overlayStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.40)',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlayTitle: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  overlayPill: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  overlayPillPlaceholder: { width: 56 },
  overlayPillText: { fontSize: 11, fontWeight: '700', color: '#111', letterSpacing: 0.2 },
  dataSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 14,
  },
  qualityBlock: { marginBottom: 10 },
  qualityTrack: {
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    marginBottom: 5,
  },
  qualityFill: { height: 3, borderRadius: 3 },
  qualityCaption: {
    fontSize: 9,
    color: 'rgba(0,0,0,0.32)',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 12,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.46)',
    letterSpacing: 0.1,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  taskCheck: { fontSize: 13, fontWeight: '700' },
  taskTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(0,0,0,0.65)', flex: 1 },
  timelineBlock: { marginBottom: 10 },
  timelineBar: {
    height: 5,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
    gap: 1,
  },
  timelineSeg: { height: 5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  colDivider: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: 'rgba(0,0,0,0.08)' },
  cardFooter: {
    marginTop: 14,
    fontSize: 10,
    color: 'rgba(0,0,0,0.20)',
    letterSpacing: 1.4,
    textAlign: 'center',
    fontFamily: 'Fraunces_500Medium',
  },
});
