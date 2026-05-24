import React from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { SessionEvent } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_CARD_W = SCREEN_W - 64;

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const RULE = '- - - - - - - - - - - - - - - - - -';

const QUALITY_LEVELS = [
  { min: 85, tag: 'EXCEPTIONAL',  color: '#9B59D0' },
  { min: 65, tag: 'STRONG',       color: '#4A8FD4' },
  { min: 40, tag: 'STEADY',       color: '#68A86B' },
  { min: 0,  tag: 'BUILDING',     color: '#8B8BAE' },
] as const;

function getLevel(score: number) {
  return QUALITY_LEVELS.find((l) => score >= l.min) ?? QUALITY_LEVELS[QUALITY_LEVELS.length - 1];
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
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
interface Segment { type: SegmentType; widthPct: number }

function buildSegments(events: SessionEvent[], startedAt: string, totalSec: number): Segment[] {
  if (!events?.length || totalSec <= 0) return [{ type: 'focus', widthPct: 100 }];
  const startMs = new Date(startedAt).getTime();
  const totalMs = totalSec * 1000;
  const endMs = startMs + totalMs;
  const filtered = events.filter((e) => e.at >= startMs && e.at <= endMs).sort((a, b) => a.at - b.at);
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
  if (type === 'pause') return 'rgba(0,0,0,0.10)';
  return 'rgba(200,60,60,0.35)';
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

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      {/* Header */}
      <Text style={styles.brand}>FOCO</Text>
      <Text style={styles.brandSub}>FOCUS RECEIPT</Text>

      <Text style={styles.rule}>{RULE}</Text>

      {/* Quality score */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreNum, { color: level.color }]}>{qualityScore}</Text>
        <View style={styles.scoreRight}>
          <Text style={[styles.scoreTag, { color: level.color }]}>{level.tag}</Text>
          <Text style={styles.scoreSub}>/100 · 專注品質</Text>
        </View>
      </View>

      {/* Quality bar */}
      <View style={styles.qualityTrack}>
        <View style={[styles.qualityFill, { width: `${qualityScore}%` as any, backgroundColor: level.color }]} />
      </View>

      <Text style={styles.rule}>{RULE}</Text>

      {/* Data rows */}
      <View style={styles.dataRow}>
        <Text style={styles.dataLeft}>DATE</Text>
        <Text style={styles.dataRight}>{dateTime}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLeft}>DURATION</Text>
        <Text style={styles.dataRight}>{formatDuration(duration)}</Text>
      </View>
      {taskTitle ? (
        <View style={styles.dataRow}>
          <Text style={styles.dataLeft}>TASK</Text>
          <Text style={[styles.dataRight, { flex: 1 }]} numberOfLines={1}>{taskTitle}</Text>
        </View>
      ) : null}
      <View style={styles.dataRow}>
        <Text style={styles.dataLeft}>PAUSES</Text>
        <Text style={styles.dataRight}>{String(pauses).padStart(2, '0')}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={styles.dataLeft}>LEFT APP</Text>
        <Text style={styles.dataRight}>{String(leftApp).padStart(2, '0')}</Text>
      </View>

      {events.length > 0 && (
        <>
          <Text style={styles.rule}>{RULE}</Text>
          <Text style={styles.timelineLabel}>SESSION TIMELINE</Text>
          <View style={styles.timelineBar}>
            {segments.map((seg, i) => (
              <View
                key={i}
                style={[
                  styles.timelineSeg,
                  {
                    width: `${seg.widthPct}%` as any,
                    backgroundColor: segColor(seg.type, level.color),
                    borderRadius: i === 0 || i === segments.length - 1 ? 3 : 0,
                  },
                ]}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.rule}>{RULE}</Text>

      {showOverlayShare && onOverlayShare ? (
        <TouchableOpacity style={[styles.shareBtn, { borderColor: level.color }]} onPress={onOverlayShare} activeOpacity={0.8}>
          <Text style={[styles.shareBtnText, { color: level.color }]}>Share ↗</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.footer}>foco.app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  brand: {
    fontFamily: MONO,
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 2,
  },
  brandSub: {
    fontFamily: MONO,
    fontSize: 10,
    color: 'rgba(20,16,28,0.40)',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 10,
  },
  rule: {
    fontFamily: MONO,
    fontSize: 10,
    color: 'rgba(20,16,28,0.25)',
    textAlign: 'center',
    marginVertical: 8,
    letterSpacing: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  scoreNum: {
    fontFamily: MONO,
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 58,
    includeFontPadding: false,
  },
  scoreRight: { flex: 1 },
  scoreTag: {
    fontFamily: MONO,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scoreSub: {
    fontFamily: MONO,
    fontSize: 10,
    color: 'rgba(20,16,28,0.40)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  qualityTrack: {
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.07)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  qualityFill: { height: 3, borderRadius: 3 },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginVertical: 3,
    gap: 8,
  },
  dataLeft: {
    fontFamily: MONO,
    fontSize: 10,
    color: 'rgba(20,16,28,0.40)',
    letterSpacing: 1.5,
    flexShrink: 0,
  },
  dataRight: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#111',
    fontWeight: '600',
    textAlign: 'right',
  },
  timelineLabel: {
    fontFamily: MONO,
    fontSize: 9,
    color: 'rgba(20,16,28,0.35)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  timelineBar: {
    height: 5,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
    gap: 1,
  },
  timelineSeg: { height: 5 },
  shareBtn: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareBtnText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  footer: {
    fontFamily: MONO,
    fontSize: 9,
    color: 'rgba(20,16,28,0.20)',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 4,
  },
});
