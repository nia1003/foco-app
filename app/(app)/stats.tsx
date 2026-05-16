/**
 * StatsScreen — Focus analytics (bar chart, streak, breakdown).
 * iOS 26: SoftWallpaper + FrostCard.
 * 資料來源：focoService.getSessions()，後端未好時 fallback mockSessions
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { getSessions } from '@/services/focoService';
import { mockSessions } from '@/data/mockData';
import type { SessionRecord } from '@/types';

// DISC 顏色對照
const DISC_COLOR: Record<string, string> = {
  conscientiousness: '#4A90E2',
  dominance: Colors.pinkText,
  steadiness: '#5BAD6F',
  influence: '#F5A623',
};

// 取最近 7 天的日期（含今天）
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
  const days = getLast7Days();
  return days.map((date) => {
    const dayStart = date.getTime();
    const dayEnd = dayStart + 86400000;
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

// 依 focus_type_result 算分佈
function buildDiscBreakdown(sessions: SessionRecord[]) {
  const counts: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.focus_type_result) {
      counts[s.focus_type_result] = (counts[s.focus_type_result] ?? 0) + 1;
    }
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      pct: count / total,
      color: DISC_COLOR[type] ?? Colors.inkSoft,
    }));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function StatsScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { activePet } = usePetStore();
  const activePetDef =
    (activePet ? PETS.find((p) => p.id === activePet.name.toLowerCase()) : null) ??
    PETS[0];

  // loading=true 直到資料到位（避免空值→真實資料的「閃爍」）
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [summary, setSummary] = useState({ total_focus_sec: 0, streak_days: 0, total_sessions: 0 });
  const [selectedDay, setSelectedDay] = useState(6); // 預設今天（最後一天）

  useEffect(() => {
    if (!userId) {
      // 未登入：直接顯示 mock
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
        // 後端失敗：fallback mock
        setSessions(mockSessions.sessions);
        setSummary(mockSessions.summary);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const weekStats = buildWeekStats(sessions);
  const MAX_H = Math.max(...weekStats.map((d) => d.hours), 0.1);
  const discBreakdown = buildDiscBreakdown(sessions);

  // 日期範圍標題
  const weekStart = weekStats[0]?.date;
  const weekEnd = weekStats[6]?.date;
  const weekRangeStr = weekStart && weekEnd
    ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    : '';

  const totalHours = Math.round((summary.total_focus_sec / 3600) * 10) / 10;

  const selected = weekStats[selectedDay];

  // 資料尚未到位：只顯示背景 + bar，不渲染任何數字（避免閃爍）
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.sub}>Week of {weekRangeStr}</Text>

        {/* Summary row */}
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

        {/* Bar chart */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Daily Focus Hours</Text>
              <View style={styles.bars}>
                {weekStats.map((d, i) => {
                  const pct = d.hours / MAX_H;
                  const active = selectedDay === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.barCol}
                      onPress={() => setSelectedDay(i)}
                      activeOpacity={0.7}
                    >
                      {active && (
                        <View style={styles.tooltip}>
                          <Text style={styles.tooltipText}>{d.hours}h</Text>
                        </View>
                      )}
                      <View style={styles.barBg}>
                        <View style={[
                          styles.barFill,
                          { height: `${Math.max(pct * 100, 4)}%` as any },
                          active && styles.barFillActive,
                        ]} />
                      </View>
                      <Text style={[styles.barDay, active && styles.barDayActive]}>{d.day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Selected day detail */}
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

        {/* DISC Breakdown */}
        {discBreakdown.length > 0 && (
          <View style={styles.section}>
            <FrostCard radius={24} padded={false}>
              <View style={styles.breakdownCard}>
                <Text style={styles.chartTitle}>Focus type breakdown</Text>
                {discBreakdown.map((b, i) => (
                  <View key={i} style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, { backgroundColor: b.color }]} />
                    <Text style={styles.breakdownLabel}>{b.label}</Text>
                    <View style={styles.breakdownBarBg}>
                      <View style={[styles.breakdownBarFill, { width: `${b.pct * 100}%` as any, backgroundColor: b.color }]} />
                    </View>
                    <Text style={styles.breakdownPct}>{Math.round(b.pct * 100)}%</Text>
                  </View>
                ))}
              </View>
            </FrostCard>
          </View>
        )}

        {/* Recent sessions */}
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
                        <Text style={styles.sessionTitle}>{mins} min · {s.focus_type_result ?? 'unknown'}</Text>
                        <Text style={styles.sessionSub}>{dateStr} · +{s.xp_earned} XP</Text>
                      </View>
                      <View style={[styles.sessionBadge, !s.completed && styles.sessionBadgeInactive]}>
                        <Text style={[styles.sessionBadgeText, !s.completed && styles.sessionBadgeTextInactive]}>
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

        {/* Pet insight card */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.insightCard}>
              <PetRenderer pet={activePetDef} size={60} interactive={false} />
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>Your pet says</Text>
                <Text style={styles.insightText}>
                  {summary.streak_days >= 3
                    ? `${summary.streak_days} days in a row! You're on fire! 🔥`
                    : 'Keep going — a streak is just around the corner!'}
                </Text>
              </View>
            </View>
          </FrostCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.beige },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },
  title: { fontFamily: 'Fraunces_500Medium', fontSize: 42, fontWeight: '500', color: Colors.ink, marginTop: 12, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: Colors.inkSoft, marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  summaryCard: { flex: 1 },
  summaryInner: { padding: 14 },
  summaryVal: { fontFamily: 'Fraunces_500Medium', fontSize: 22, fontWeight: '500', color: Colors.ink, letterSpacing: -0.4 },
  summaryLabel: { fontSize: 9, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 6 },
  section: { marginTop: 12 },
  chartCard: { padding: 22, paddingTop: 38, overflow: 'visible' },
  chartTitle: { fontSize: 14, fontWeight: '600', color: Colors.ink, marginBottom: 18 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6, overflow: 'visible' },
  barCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', overflow: 'visible' },
  tooltip: {
    position: 'absolute', top: 0,
    backgroundColor: Colors.ink, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  tooltipText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  barBg: { width: '100%', height: 80, justifyContent: 'flex-end', borderRadius: 6, backgroundColor: 'rgba(20,16,28,0.06)' },
  barFill: { width: '100%', borderRadius: 6, backgroundColor: 'rgba(242,206,220,0.60)' },
  barFillActive: { backgroundColor: Colors.pinkHot },
  barDay: { fontSize: 11, color: Colors.inkFaint, fontWeight: '500' },
  barDayActive: { color: Colors.ink, fontWeight: '700' },
  selectedDetail: { marginTop: 12 },
  selectedDetailText: { fontSize: 12, color: Colors.inkSoft, textAlign: 'center' },
  breakdownCard: { padding: 22 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 12, color: Colors.ink, width: 100, textTransform: 'capitalize' },
  breakdownBarBg: { flex: 1, height: 6, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  breakdownBarFill: { height: 6, borderRadius: 9999 },
  breakdownPct: { fontSize: 11, fontWeight: '600', color: Colors.ink, width: 30, textAlign: 'right' },
  recentCard: { padding: 22 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(20,16,28,0.08)' },
  sessionDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 14, fontWeight: '600', color: Colors.ink, textTransform: 'capitalize' },
  sessionSub: { fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
  sessionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, backgroundColor: 'rgba(242,206,220,0.50)' },
  sessionBadgeInactive: { backgroundColor: 'rgba(20,16,28,0.06)' },
  sessionBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.pinkText },
  sessionBadgeTextInactive: { color: Colors.inkFaint },
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 18 },
  insightPet: { width: 60, height: 60 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  insightText: { fontSize: 13, color: Colors.inkSoft, lineHeight: 18 },
});
