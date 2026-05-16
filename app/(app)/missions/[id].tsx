/**
 * MissionScreen — single quest detail with progress + rewards.
 * iOS 26: FocoWallpaper + Glass cards.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { Glass } from '@/components/ui/Glass';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';

export default function MissionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { play } = useSound();

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar back />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ACTIVE QUEST</Text>
          <Text style={styles.title}>Morning Focus Sprint</Text>
          <Text style={styles.sub}>Complete 3 sessions before noon</Text>
        </View>

        {/* Progress card */}
        <View style={styles.section}>
          <Glass radius={24} tone="chrome" padded={false}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>PROGRESS</Text>
                <Text style={styles.progressPct}>2 / 3</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: '66%' }]} />
              </View>
              <View style={styles.sessionDots}>
                {[1, 1, 0].map((d, i) => (
                  <View key={i} style={[styles.sessionDot, { backgroundColor: d ? '#b5607a' : 'rgba(20,16,28,0.10)' }]} />
                ))}
              </View>
            </View>
          </Glass>
        </View>

        {/* Rewards card */}
        <View style={styles.section}>
          <Glass radius={24} tone="chrome" padded={false}>
            <View style={styles.rewardsCard}>
              <Text style={styles.rewardsTitle}>Rewards</Text>
              <View style={styles.rewardsList}>
                {[
                  { emoji: '⭐', label: '+30 XP', sub: 'Experience points' },
                  { emoji: '🎖️', label: 'Focus Badge', sub: 'Rare collectible' },
                ].map((r, i) => (
                  <View key={i} style={[styles.rewardItem, i < 1 && styles.rewardDivider]}>
                    <Text style={styles.rewardEmoji}>{r.emoji}</Text>
                    <View>
                      <Text style={styles.rewardLabel}>{r.label}</Text>
                      <Text style={styles.rewardSub}>{r.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Glass>
        </View>

        {/* Start CTA */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => { play('transition_up'); router.push('/(app)/focus'); }}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>START SESSION →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 60 },
  header: { marginTop: 16, paddingHorizontal: 4 },
  eyebrow: { fontSize: 10, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontFamily: 'Fraunces_500Medium', fontSize: 32, fontWeight: '500', color: Colors.ink, marginTop: 8, letterSpacing: -0.4, lineHeight: 38 },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6 },
  section: { marginTop: 16 },
  progressCard: { padding: 22 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  progressLabel: { fontSize: 10, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6 },
  progressPct: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  progressBg: { height: 8, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  progressFill: { height: 8, borderRadius: 9999, backgroundColor: '#F2CEDC' },
  sessionDots: { flexDirection: 'row', gap: 10, marginTop: 14 },
  sessionDot: { width: 18, height: 18, borderRadius: 9 },
  rewardsCard: { padding: 22 },
  rewardsTitle: { fontSize: 16, fontWeight: '600', color: Colors.ink, marginBottom: 14 },
  rewardsList: {},
  rewardItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  rewardDivider: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(20,16,28,0.08)' },
  rewardEmoji: { fontSize: 24, width: 36, textAlign: 'center' },
  rewardLabel: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  rewardSub: { fontSize: 11, color: Colors.inkFaint, marginTop: 1 },
  startBtn: {
    marginTop: 24, paddingVertical: 20, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 3 },
});
