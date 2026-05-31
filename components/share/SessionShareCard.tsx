import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { focusCardType } from '@/constants/shareTypography';
import type { SessionEvent } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_CARD_W = SCREEN_W - 64;

const RULE = '- - - - - - - - - - - - - - - - - -';

const QUALITY_LEVELS = [
  { min: 85, tag: 'EXCEPTIONAL', color: '#9B59D0' },
  { min: 65, tag: 'STRONG', color: '#4A8FD4' },
  { min: 40, tag: 'STEADY', color: '#68A86B' },
  { min: 0, tag: 'BUILDING', color: '#8B8BAE' },
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
      <Text style={focusCardType.brand}>FOCO</Text>
      <Text style={[focusCardType.brandSub, styles.brandSubGap]}>FOCUS RECEIPT</Text>

      <Text style={[focusCardType.rule, styles.ruleGap]}>{RULE}</Text>

      <View style={styles.scoreRow}>
        <Text style={[focusCardType.score, { color: level.color }]}>{qualityScore}</Text>
        <View style={styles.scoreRight}>
          <Text style={[focusCardType.scoreTag, { color: level.color }]}>{level.tag}</Text>
          <Text style={focusCardType.scoreSub}>/100 · 專注品質</Text>
        </View>
      </View>

      <View style={styles.qualityTrack}>
        <View style={[styles.qualityFill, { width: `${qualityScore}%` as `${number}%`, backgroundColor: level.color }]} />
      </View>

      <Text style={[focusCardType.rule, styles.ruleGap]}>{RULE}</Text>

      <View style={styles.dataRow}>
        <Text style={focusCardType.dataLabel}>DATE</Text>
        <Text style={focusCardType.dataValue}>{dateTime}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={focusCardType.dataLabel}>DURATION</Text>
        <Text style={focusCardType.dataValue}>{formatDuration(duration)}</Text>
      </View>
      {taskTitle ? (
        <View style={styles.dataRow}>
          <Text style={focusCardType.dataLabel}>TASK</Text>
          <Text style={[focusCardType.dataValue, styles.dataValueFlex]} numberOfLines={1}>{taskTitle}</Text>
        </View>
      ) : null}
      <View style={styles.dataRow}>
        <Text style={focusCardType.dataLabel}>PAUSES</Text>
        <Text style={focusCardType.dataValue}>{String(pauses).padStart(2, '0')}</Text>
      </View>
      <View style={styles.dataRow}>
        <Text style={focusCardType.dataLabel}>LEFT APP</Text>
        <Text style={focusCardType.dataValue}>{String(leftApp).padStart(2, '0')}</Text>
      </View>

      {events.length > 0 && (
        <>
          <Text style={[focusCardType.rule, styles.ruleGap]}>{RULE}</Text>
          <Text style={focusCardType.timelineLabel}>SESSION TIMELINE</Text>
          <View style={styles.timelineBar}>
            {segments.map((seg, i) => (
              <View
                key={i}
                style={[
                  styles.timelineSeg,
                  {
                    width: `${seg.widthPct}%` as `${number}%`,
                    backgroundColor: segColor(seg.type, level.color),
                    borderRadius: i === 0 || i === segments.length - 1 ? 3 : 0,
                  },
                ]}
              />
            ))}
          </View>
        </>
      )}

      <Text style={[focusCardType.rule, styles.ruleGap]}>{RULE}</Text>

      {showOverlayShare && onOverlayShare ? (
        <TouchableOpacity style={[styles.shareBtn, { borderColor: level.color }]} onPress={onOverlayShare} activeOpacity={0.8}>
          <Text style={[focusCardType.shareBtn, { color: level.color }]}>Share ↗</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={focusCardType.footer}>foco.app</Text>
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
  brandSubGap: { marginBottom: 10 },
  ruleGap: { marginVertical: 8 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  scoreRight: { flex: 1 },
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
  dataValueFlex: { flex: 1, textAlign: 'right' },
  timelineBar: {
    height: 5,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
    gap: 1,
    marginBottom: 4,
  },
  timelineSeg: { height: 5 },
  shareBtn: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
});
