/**
 * AnalysisScreen — DISC 專注報告
 * 可截圖分享的個性化 DISC 卡片（社群媒體分享設計）
 * 包含：時間軸視覺化、時段分析、品質分數
 */
import React, { useRef } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FocoBar } from '@/components/layout/FocoBar';
import type { SessionResult, SessionEvent } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 32;

// ── DISC 視覺配置 ─────────────────────────────
const DISC_CONFIG = {
  conscientiousness: {
    label: 'Conscientiousness',
    zh: '謹慎型',
    tagline: '精準執行，掌控每個細節',
    traits: ['零干擾專注', '高完成率', '完美主義'],
    gradient: ['#1a1a2e', '#16213e', '#0f3460'] as const,
    accent: '#4A90E2',
    accentLight: 'rgba(74,144,226,0.20)',
    icon: '◈',
    desc: '你今天的專注品質頂尖。幾乎零干擾地完成了目標，每個細節都在掌控之中。這是最深度的工作狀態。',
    hashtag: '#謹慎型 #FocusType #FOCO',
  },
  dominance: {
    label: 'Dominance',
    zh: '主導型',
    tagline: '目標掛帥，勇往直前',
    traits: ['高執行力', '目標導向', '強韌意志'],
    gradient: ['#1a0a0a', '#2d1010', '#4a1515'] as const,
    accent: '#E05A5A',
    accentLight: 'rgba(224,90,90,0.20)',
    icon: '▲',
    desc: '你有清晰的目標感，中途遇到阻礙也能堅持完成。主導型的人不輕易放棄，完成是最大的勝利。',
    hashtag: '#主導型 #FocusType #FOCO',
  },
  steadiness: {
    label: 'Steadiness',
    zh: '穩健型',
    tagline: '節奏穩定，細水長流',
    traits: ['持續耐力', '踏實推進', '壓力抵抗'],
    gradient: ['#0a1a0f', '#0f2d18', '#154a22'] as const,
    accent: '#5BAD6F',
    accentLight: 'rgba(91,173,111,0.20)',
    icon: '◉',
    desc: '穩健是一種力量。你保持著自己的節奏，不急不躁。持續累積比衝刺更能帶來長遠的改變。',
    hashtag: '#穩健型 #FocusType #FOCO',
  },
  influence: {
    label: 'Influence',
    zh: '影響型',
    tagline: '彈性靈活，熱情滿滿',
    traits: ['靈活適應', '熱情驅動', '富有彈性'],
    gradient: ['#1a1400', '#2d2200', '#4a3800'] as const,
    accent: '#F5A623',
    accentLight: 'rgba(245,166,35,0.20)',
    icon: '◆',
    desc: '今天比較多干擾，但你依然完成了一段專注。嘗試把下次的時段縮短 10 分鐘，更容易進入狀態。',
    hashtag: '#影響型 #FocusType #FOCO',
  },
} as const;

type DiscKey = keyof typeof DISC_CONFIG;

// ── 時段判斷 ──────────────────────────────────
function getTimeOfDay(startedAt: string): string {
  const hour = new Date(startedAt).getHours();
  if (hour < 6)  return '🌙 深夜';
  if (hour < 12) return '🌅 早上';
  if (hour < 17) return '☀️ 下午';
  if (hour < 21) return '🌆 傍晚';
  return '🌙 夜晚';
}

function formatStartTime(startedAt: string): string {
  const d = new Date(startedAt);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ── 時間軸分段 ────────────────────────────────
type SegmentType = 'focus' | 'pause' | 'left_app';

interface Segment {
  type: SegmentType;
  widthPct: number;
}

function buildSegments(
  events: SessionEvent[],
  startedAt: string,
  totalSec: number,
): Segment[] {
  if (!events?.length || totalSec <= 0) {
    return [{ type: 'focus', widthPct: 100 }];
  }

  const startMs = new Date(startedAt).getTime();
  const totalMs = totalSec * 1000;
  const endMs = startMs + totalMs;

  const filtered = events
    .filter(e => e.at >= startMs && e.at <= endMs)
    .sort((a, b) => a.at - b.at);

  const segments: Segment[] = [];
  let cursor = startMs;
  let current: SegmentType = 'focus';

  for (const ev of filtered) {
    const dur = ev.at - cursor;
    if (dur > 500) {
      segments.push({ type: current, widthPct: (dur / totalMs) * 100 });
    }
    cursor = ev.at;
    if (ev.type === 'pause')    current = 'pause';
    if (ev.type === 'resume')   current = 'focus';
    if (ev.type === 'left_app') current = 'left_app';
    if (ev.type === 'returned') current = 'focus';
  }

  const remaining = endMs - cursor;
  if (remaining > 500) {
    segments.push({ type: current, widthPct: (remaining / totalMs) * 100 });
  }

  return segments.length ? segments : [{ type: 'focus', widthPct: 100 }];
}

function segmentColor(type: SegmentType, accent: string): string {
  if (type === 'focus')    return accent;
  if (type === 'pause')    return 'rgba(255,255,255,0.22)';
  return 'rgba(255,80,80,0.55)';
}

// ── 格式化 ────────────────────────────────────
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

export default function AnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { result: resultStr } = useLocalSearchParams<{ result: string }>();
  const result: SessionResult = resultStr ? JSON.parse(resultStr) : {};
  const cardRef = useRef<View>(null);
  const { play } = useSound();

  const discKey: DiscKey = (result.focus_type as DiscKey) ?? 'steadiness';
  const cfg = DISC_CONFIG[discKey] ?? DISC_CONFIG.steadiness;

  const qualityScore  = result.quality_score ?? 0;
  const duration      = result.actual_duration ?? 0;
  const pauses        = result.pause_count ?? 0;
  const xpGained      = result.xp_gained ?? 0;
  const startedAt     = result.started_at ?? new Date().toISOString();
  const events        = result.events ?? [];

  const timeOfDay  = getTimeOfDay(startedAt);
  const startTime  = formatStartTime(startedAt);
  const segments   = buildSegments(events, startedAt, duration);
  const hasTimeline = events.length > 0;

  const handleShare = async () => {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1.0 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '分享我的 FOCO 專注類型' });
      } else {
        Alert.alert('無法分享', '此裝置不支援分享功能');
      }
    } catch {
      Alert.alert('錯誤', '截圖失敗，請再試一次');
    }
  };

  const handleSave = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('需要權限', '請允許存取相片庫以儲存圖片');
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1.0 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('已儲存 ✅', '卡片已存入相簿！');
    } catch {
      Alert.alert('錯誤', '儲存失敗，請再試一次');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <AppBackground />
      <FocoBar back />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 截圖卡片 ─────────────────────────── */}
        <View ref={cardRef} collapsable={false}>
          <LinearGradient
            colors={cfg.gradient}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={[styles.card, { width: CARD_W }]}
          >
            {/* 頂部品牌 */}
            <View style={styles.brandRow}>
              <Text style={styles.brandName}>FOCO</Text>
              <Text style={[styles.brandTag, { color: cfg.accent }]}>Focus Type</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: cfg.accentLight }]} />

            {/* 類型主體 */}
            <View style={styles.typeSection}>
              <Text style={[styles.typeIcon, { color: cfg.accent }]}>{cfg.icon}</Text>
              <Text style={[styles.typeName, { color: cfg.accent }]}>{cfg.label}</Text>
              <Text style={styles.typeZh}>{cfg.zh}</Text>
              <Text style={styles.tagline}>{cfg.tagline}</Text>
              {/* 時段標籤 */}
              <View style={[styles.timeTag, { backgroundColor: cfg.accentLight, borderColor: cfg.accent + '40' }]}>
                <Text style={[styles.timeTagText, { color: cfg.accent }]}>
                  {timeOfDay}  {startTime} 開始
                </Text>
              </View>
            </View>

            {/* 特質標籤 */}
            <View style={styles.traitsRow}>
              {cfg.traits.map((t) => (
                <View key={t} style={[styles.traitPill, { backgroundColor: cfg.accentLight, borderColor: cfg.accent + '60' }]}>
                  <Text style={[styles.traitText, { color: cfg.accent }]}>{t}</Text>
                </View>
              ))}
            </View>

            {/* 品質分條 */}
            <View style={styles.qualitySection}>
              <View style={styles.qualityLabelRow}>
                <Text style={styles.qualityLabel}>專注品質</Text>
                <Text style={[styles.qualityScore, { color: cfg.accent }]}>
                  {qualityScore}<Text style={styles.qualityMax}> / 100</Text>
                </Text>
              </View>
              <View style={styles.qualityTrack}>
                <View style={[styles.qualityFill, { width: `${qualityScore}%` as any, backgroundColor: cfg.accent }]} />
              </View>
            </View>

            {/* 時間軸 */}
            {hasTimeline && (
              <View style={styles.timelineSection}>
                <Text style={styles.timelineLabel}>專注時間軸</Text>
                <View style={styles.timelineBar}>
                  {segments.map((seg, i) => (
                    <View
                      key={i}
                      style={[
                        styles.timelineSegment,
                        {
                          width: `${seg.widthPct}%` as any,
                          backgroundColor: segmentColor(seg.type, cfg.accent),
                          borderRadius: i === 0 ? 4 : i === segments.length - 1 ? 4 : 0,
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.timelineLegend}>
                  <LegendDot color={cfg.accent} label="專注" />
                  <LegendDot color="rgba(255,255,255,0.22)" label="暫停" />
                  <LegendDot color="rgba(255,80,80,0.55)" label="離開" />
                </View>
              </View>
            )}

            {/* 數據行 */}
            <View style={styles.statsRow}>
              <StatCell label="時長" value={formatDuration(duration)} accent={cfg.accent} />
              <View style={[styles.statDivider, { backgroundColor: cfg.accentLight }]} />
              <StatCell label="暫停" value={`${pauses} 次`} accent={cfg.accent} />
            </View>

            {/* 描述文字 */}
            <Text style={styles.desc}>{cfg.desc}</Text>

            <View style={[styles.divider, { backgroundColor: cfg.accentLight, marginTop: 20 }]} />

            {/* 底部 */}
            <View style={styles.footerRow}>
              <Text style={styles.footerBrand}>foco.app</Text>
              <Text style={[styles.footerHash, { color: cfg.accent + 'cc' }]}>{cfg.hashtag}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── 操作按鈕 ─────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: cfg.accent }]}
            onPress={() => { play('tap'); handleShare(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.shareBtnText}>分享結果 ↗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => { play('tap'); handleSave(); }}
            activeOpacity={0.75}
          >
            <Text style={styles.saveBtnText}>存圖片</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => { play('transition_down'); router.replace('/(app)/home'); }}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>回首頁</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function StatCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingTop: 8, paddingHorizontal: 16 },

  card: {
    borderRadius: 28,
    padding: 28,
    overflow: 'hidden',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
  },
  brandTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  divider: { height: 1, borderRadius: 1, marginBottom: 24 },

  typeSection: { alignItems: 'center', marginBottom: 20 },
  typeIcon: { fontSize: 36, marginBottom: 8 },
  typeName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 34,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  typeZh: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  timeTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  timeTagText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
  traitPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  traitText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },

  qualitySection: { marginBottom: 20 },
  qualityLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  qualityLabel: { fontSize: 12, color: 'rgba(255,255,255,0.50)', letterSpacing: 0.5 },
  qualityScore: { fontFamily: 'Fraunces_500Medium', fontSize: 22 },
  qualityMax: { fontSize: 12, color: 'rgba(255,255,255,0.40)', fontFamily: 'System' },
  qualityTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  qualityFill: { height: 4, borderRadius: 4 },

  timelineSection: { marginBottom: 20 },
  timelineLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  timelineBar: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 1,
  },
  timelineSegment: { height: 8 },
  timelineLegend: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: 'rgba(255,255,255,0.40)' },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 17, fontWeight: '700' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.3 },
  statDivider: { width: 1, height: 32, borderRadius: 1 },

  desc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footerBrand: { fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 },
  footerHash: { fontSize: 11, letterSpacing: 0.2 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 20, width: CARD_W },
  shareBtn: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 6,
  },
  shareBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  saveBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  homeBtn: {
    marginTop: 10,
    width: CARD_W,
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
  },
});
