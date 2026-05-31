import React, { useMemo } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import type { SessionEvent } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_CARD_W = SCREEN_W - 64;

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const QUALITY_LEVELS = [
  { min: 85, tag: 'EXCELLENT',  color: '#5B92E5', bgColor: '#E3F2FD' }, 
  { min: 65, tag: 'STRONG',     color: '#E87D98', bgColor: '#FFF0F3' }, 
  { min: 40, tag: 'STEADY',     color: '#55B368', bgColor: '#E8F5E9' }, 
  { min: 0,  tag: 'BUILDING',   color: '#C6A750', bgColor: '#FFF8E1' }, 
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
  if (m === 0) return `${s} 秒`;
  return s === 0 ? `${m} 分鐘` : `${m} 分 ${s} 秒`;
}

function generateStory(petName: string, duration: number, score: number, taskTitle?: string | null): string {
  const isHighQuality = score >= 80;
  const isStruggling = score < 40;
  const durationStr = formatDuration(duration);

  if (isHighQuality) {
    return `這是一段極具質感的專注時光。你和 ${petName} 一起努力了 ${durationStr}。${taskTitle ? `在「${taskTitle}」上取得了很棒的進展呢！` : '這段時間裡你心無旁騖，狀態超好！'}這張快照記錄了你們絕佳的專注瞬間，繼續保持下去吧！`;
  } else if (isStruggling) {
    return `哎呀，剛才外界的誘惑似乎有點多呢，讓專注變得有些艱難。但沒關係，你和 ${petName} 還是努力堅持了 ${durationStr}。${taskTitle ? `雖然「${taskTitle}」走得有些慢，` : ''}但願意坐在這裡重新開始就是最棒的！下次我們再一起加油！`;
  } else {
    return `今天和 ${petName} 穩穩地度過了 ${durationStr} 的平靜時光。${taskTitle ? `你一步一腳印地推進了「${taskTitle}」，` : '這段專注的時間裡，'}牠看起來非常滿意，還在你的手帳上留下了一個專屬印記呢！繼續保持好習慣喔。`;
  }
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
  if (type === 'pause') return 'rgba(0,0,0,0.12)';
  return 'rgba(200,60,60,0.30)';
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
  petName?: string; 
  petImage?: any;
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
  petName = '小夥伴', 
  petImage,
}: SessionShareCardProps) {
  const level = getLevel(qualityScore);
  const dateTime = formatDateTime(startedAt);
  const segments = buildSegments(events, startedAt, duration);
  const storyText = useMemo(() => generateStory(petName, duration, qualityScore, taskTitle), [petName, duration, qualityScore, taskTitle]);
  const stampTextColor = level.color === '#C6A750' ? '#9E8231' : level.color;

  return (
    <View style={[styles.card, { width: cardWidth, backgroundColor: level.bgColor }]}>
      
      <View style={styles.polaroidWrapper}>
        <View style={styles.polaroid}>
          <View style={[styles.washiTape, { backgroundColor: level.color }]} />

          <View style={styles.photoArea}>
            {petImage ? (
              <Image source={petImage} style={styles.petImage} resizeMode="contain" />
            ) : null}
          </View>
          {/* 只顯示寵物名字 */}
          <Text style={styles.polaroidText}>{petName}</Text>

          <View style={[styles.refinedStamp, { borderColor: level.color }]}>
            <View style={[styles.innerCircle, { borderColor: level.color }]} />
            <Text style={[styles.refinedStampScore, { color: stampTextColor }]}>{qualityScore}</Text>
          </View>
        </View>
      </View>

      <View style={styles.storyArea}>
        <Text style={styles.storyText}>{storyText}</Text>
      </View>

      <View style={styles.scoreRow}>
        <Text style={[styles.scoreNum, { color: level.color }]}>{qualityScore}</Text>
        <View style={styles.scoreRight}>
          <Text style={[styles.scoreTag, { color: level.color }]}>{level.tag}</Text>
          <Text style={styles.scoreSub}>/100 · 專注品質</Text>
        </View>
      </View>

      {events.length > 0 && (
        <View style={styles.timelineSection}>
          <View style={styles.timelineBar}>
            {segments.map((seg, i) => (
              <View
                key={i}
                style={[
                  styles.timelineSeg,
                  {
                    width: `${seg.widthPct}%` as any,
                    backgroundColor: segColor(seg.type, level.color),
                    borderRadius: i === 0 || i === segments.length - 1 ? 4 : 0,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.timelineStats}>
            中斷 {pauses} 次 · 離開畫面 {leftApp} 次
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.dateText}>{dateTime}</Text>
      </View>

      {showOverlayShare && onOverlayShare ? (
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: level.color }]} onPress={onOverlayShare} activeOpacity={0.85}>
          <Text style={styles.shareBtnText}>分享明信片 ↗</Text>
        </TouchableOpacity>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 24, shadowColor: '#A08D71', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: '#FFFFFF', position: 'relative' },
  polaroidWrapper: { alignItems: 'center', marginTop: -10, marginBottom: 26 },
  polaroid: { 
    backgroundColor: '#FFFFFF', 
    padding: 12, 
    paddingBottom: 16, 
    alignItems: 'center', // 確保照片與文字絕對置中
    borderRadius: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 2, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 6, 
    elevation: 4, 
    transform: [{ rotate: '-3deg' }], 
    borderWidth: 0.5, 
    borderColor: '#F0F0F0', 
    position: 'relative', 
    overflow: 'visible' 
  },
  washiTape: { position: 'absolute', top: -8, left: '50%', marginLeft: -25, width: 50, height: 16, borderRadius: 1, zIndex: 10, opacity: 0.35 },
  photoArea: { backgroundColor: '#F9F9F9', borderRadius: 2, width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  petImage: { width: 110, height: 110 },
  polaroidText: { 
    marginTop: 12, 
    textAlign: 'center', 
    fontFamily: MONO, 
    color: '#A0A0A0', 
    fontSize: 12, 
    letterSpacing: 2, 
    textTransform: 'uppercase' 
  },
  
  refinedStamp: {
    position: 'absolute',
    bottom: 26, 
    right: -12, 
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    transform: [{ rotate: '8deg' }],
  },
  innerCircle: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed' },
  refinedStampScore: { fontSize: 16, fontWeight: '800', fontFamily: MONO },

  storyArea: { marginBottom: 20 },
  storyText: { fontSize: 15, color: '#666', lineHeight: 26, fontWeight: '500' },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderStyle: 'dashed', 
    borderTopColor: 'rgba(0,0,0,0.06)', 
  },
  scoreNum: {
    fontFamily: MONO,
    fontSize: 42, 
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 46,
  },
  scoreRight: { flex: 1 },
  scoreTag: {
    fontFamily: MONO,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scoreSub: {
    fontFamily: MONO,
    fontSize: 11,
    color: '#A89F91',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  timelineSection: { marginBottom: 24 },
  timelineBar: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.04)', gap: 1, marginBottom: 8 },
  timelineSeg: { height: 6 },
  timelineStats: { fontFamily: MONO, fontSize: 10, color: '#B0B0B0', textAlign: 'right' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 16, marginBottom: 10 },
  dateText: { fontSize: 11, color: '#B0B0B0', fontFamily: MONO, letterSpacing: 1 },
  shareBtn: { borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  shareBtnText: { fontFamily: MONO, fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: 1 },
});