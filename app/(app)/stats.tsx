/**
 * StatsScreen — Focus analytics (bar chart, streak, breakdown).
 * iOS 26: SoftWallpaper + FrostCard.
 */
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { TabBar } from '@/components/layout/TabBar';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';

const activePet = PETS[0];

const WEEK = [
  { day: 'M', hours: 1.5, sessions: 3 },
  { day: 'T', hours: 2.0, sessions: 4 },
  { day: 'W', hours: 0.5, sessions: 1 },
  { day: 'T', hours: 3.0, sessions: 6 },
  { day: 'F', hours: 2.5, sessions: 5 },
  { day: 'S', hours: 1.0, sessions: 2 },
  { day: 'S', hours: 0, sessions: 0 },
];
const MAX_H = Math.max(...WEEK.map((d) => d.hours));

export default function StatsScreen() {
  const [selectedDay, setSelectedDay] = useState(4); // Friday

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.sub}>Week of May 5 – 11, 2026</Text>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          {[
            { v: '10.5h', l: 'Total' },
            { v: '21', l: 'Sessions' },
            { v: '5🔥', l: 'Streak' },
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
                {WEEK.map((d, i) => {
                  const pct = MAX_H > 0 ? d.hours / MAX_H : 0;
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
                          { height: `${pct * 100}%` as any },
                          active && styles.barFillActive,
                        ]} />
                      </View>
                      <Text style={[styles.barDay, active && styles.barDayActive]}>{d.day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </FrostCard>
        </View>

        {/* Breakdown */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.breakdownCard}>
              <Text style={styles.chartTitle}>Time breakdown</Text>
              {[
                { label: 'Deep Work', pct: 0.52, color: Colors.pinkHot },
                { label: 'Study', pct: 0.30, color: Colors.blueSoft },
                { label: 'Creative', pct: 0.18, color: Colors.pinkSoft },
              ].map((b, i) => (
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

        {/* AI insight card */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.insightCard}>
              <Image source={activePet.image} style={styles.insightPet} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>Mochi says</Text>
                <Text style={styles.insightText}>
                  Your best focus window is 9–11am. Try scheduling your hardest tasks there!
                </Text>
              </View>
            </View>
          </FrostCard>
        </View>
      </ScrollView>

      <TabBar />
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
  barFill: { width: '100%', borderRadius: 6, backgroundColor: 'rgba(232,71,151,0.35)' },
  barFillActive: { backgroundColor: Colors.pinkHot },
  barDay: { fontSize: 11, color: Colors.inkFaint, fontWeight: '500' },
  barDayActive: { color: Colors.ink, fontWeight: '700' },
  breakdownCard: { padding: 22 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 12, color: Colors.ink, width: 70 },
  breakdownBarBg: { flex: 1, height: 6, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  breakdownBarFill: { height: 6, borderRadius: 9999 },
  breakdownPct: { fontSize: 11, fontWeight: '600', color: Colors.ink, width: 30, textAlign: 'right' },
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 18 },
  insightPet: { width: 44, height: 44 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  insightText: { fontSize: 13, color: Colors.inkSoft, lineHeight: 18 },
});
