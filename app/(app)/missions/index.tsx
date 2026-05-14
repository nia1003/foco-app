/**
 * MissionsScreen — Quest list with tabs (Active / Daily / Special).
 * iOS 26: FocoWallpaper + Glass cards.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { Glass } from '@/components/ui/Glass';
import { FocoBar } from '@/components/layout/FocoBar';
import { TabBar } from '@/components/layout/TabBar';
import { Colors } from '@/constants/theme';

type TabType = 'active' | 'daily' | 'special';

const QUESTS = {
  active: [
    { id: '1', title: 'Morning Focus Sprint', sub: 'Complete 3 sessions before noon', progress: 0.66, reward: '+30 XP', emoji: '🌅' },
    { id: '2', title: 'Book Worm', sub: 'Read for 2 hours total', progress: 0.45, reward: '+25 XP', emoji: '📚' },
    { id: '3', title: 'Inbox Zero', sub: 'Clear your email queue', progress: 0.2, reward: '+15 XP', emoji: '📬' },
  ],
  daily: [
    { id: '4', title: 'Daily Checkin', sub: 'Log at least 1 session today', progress: 0.0, reward: '+5 XP', emoji: '✅' },
    { id: '5', title: 'Flow State', sub: 'Complete a 50-min session', progress: 0.0, reward: '+20 XP', emoji: '🌊' },
  ],
  special: [
    { id: '6', title: 'First Week!', sub: 'Complete 7 days in a row', progress: 0.43, reward: '🏆 Trophy', emoji: '⭐' },
  ],
};

export default function MissionsScreen() {
  const [tab, setTab] = useState<TabType>('active');
  const router = useRouter();

  const quests = QUESTS[tab];

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Missions</Text>

        {/* Tab pills */}
        <View style={styles.tabs}>
          {(['active', 'daily', 'special'] as TabType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, tab === t && styles.tabPillActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quest cards */}
        <View style={styles.list}>
          {quests.map((q) => (
            <TouchableOpacity
              key={q.id}
              onPress={() => router.push(`/(app)/missions/${q.id}` as any)}
              activeOpacity={0.85}
            >
              <Glass radius={24} tone="chrome" padded={false}>
                <View style={styles.questCard}>
                  <Text style={styles.questEmoji}>{q.emoji}</Text>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{q.title}</Text>
                    <Text style={styles.questSub}>{q.sub}</Text>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${q.progress * 100}%` as any }]} />
                    </View>
                    <View style={styles.questMeta}>
                      <Text style={styles.questPct}>{Math.round(q.progress * 100)}% complete</Text>
                      <Text style={styles.questReward}>{q.reward}</Text>
                    </View>
                  </View>
                </View>
              </Glass>
            </TouchableOpacity>
          ))}
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
  title: { fontFamily: 'Fraunces_500Medium', fontSize: 42, fontWeight: '500', color: Colors.ink, marginTop: 12, marginBottom: 0, letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 20, marginBottom: 4 },
  tabPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  tabPillActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  tabLabel: { fontSize: 13, fontWeight: '500', color: Colors.inkSoft },
  tabLabelActive: { color: '#fff', fontWeight: '600' },
  list: { gap: 12, marginTop: 8 },
  questCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  questEmoji: { fontSize: 30, width: 44, textAlign: 'center' },
  questInfo: { flex: 1 },
  questTitle: { fontSize: 16, fontWeight: '600', color: Colors.ink },
  questSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  progressBg: { marginTop: 10, height: 5, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  progressFill: { height: 5, borderRadius: 9999, backgroundColor: Colors.pinkHot },
  questMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  questPct: { fontSize: 10, color: Colors.inkFaint, letterSpacing: 0.3 },
  questReward: { fontSize: 10, fontWeight: '600', color: Colors.pinkHot },
});
