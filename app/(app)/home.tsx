/**
 * HomeScreen — daily dashboard hub.
 * iOS 26: SoftWallpaper + FrostCard for pet, stats, and tasks.
 */
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { TabBar } from '@/components/layout/TabBar';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';

const activePet = PETS[0]; // Bean by default — swap based on user's choice

const STATS = [
  { v: '2.5h', l: 'Today' },
  { v: '5', l: 'Pomodoros' },
  { v: '3🔥', l: 'Day streak' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <AppBackground />

      <FocoBar />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.date}>Thursday, May 8</Text>
          <Text style={styles.greet}>Good morning,{'\n'}Nia.</Text>
        </View>

        {/* Pet card */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.petCard}>
              <View style={[styles.petAvatar, { backgroundColor: activePet.accent + '30' }]}>
                <Image source={activePet.image} style={styles.petImage} resizeMode="contain" />
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>Mochi · Lv. 3</Text>
                <Text style={styles.petQuote}>"Let's read together today."</Text>
                <View style={styles.xpBarBg}>
                  <View style={[styles.xpBarFill, { width: '64%' }]} />
                </View>
                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel}>XP 156 / 240</Text>
                  <Text style={styles.xpLabel}>Energy 72%</Text>
                </View>
              </View>
            </View>
          </FrostCard>
        </View>

        {/* Quick stats row */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <FrostCard radius={20} padded={false}>
                <View style={styles.statInner}>
                  <Text style={styles.statVal}>{s.v}</Text>
                  <Text style={styles.statLabel}>{s.l}</Text>
                </View>
              </FrostCard>
            </View>
          ))}
        </View>

        {/* Up next task */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.taskCard}>
              <Text style={styles.eyebrow}>UP NEXT</Text>
              <Text style={styles.taskTitle}>Read Chapter 4</Text>
              <Text style={styles.taskSub}>3 sessions planned · 1 done</Text>
              <View style={styles.dots}>
                {[1, 1, 0, 0, 0].map((d, i) => (
                  <View key={i} style={[styles.dot, { backgroundColor: d ? Colors.pinkHot : 'rgba(20,16,28,0.10)' }]} />
                ))}
              </View>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => router.push('/(app)/focus')}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>START FOCUS →</Text>
              </TouchableOpacity>
            </View>
          </FrostCard>
        </View>

        {/* Mission promo */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.missionCard}>
              <Text style={styles.missionEmoji}>🗺️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.missionTitle}>Daily quest available</Text>
                <Text style={styles.missionSub}>Complete 2 focus sessions today</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(app)/missions' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.missionCta}>View →</Text>
              </TouchableOpacity>
            </View>
          </FrostCard>
        </View>
      </ScrollView>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },
  greeting: { marginTop: 8, paddingHorizontal: 4 },
  date: { fontSize: 13, color: Colors.inkSoft },
  greet: { fontFamily: 'Fraunces_500Medium', fontSize: 32, fontWeight: '500', color: Colors.ink, marginTop: 4, letterSpacing: -0.4, lineHeight: 38 },
  section: { marginTop: 12 },
  petCard: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 20 },
  petAvatar: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  petImage: { width: 80, height: 80 },
  petInfo: { flex: 1 },
  petName: { fontFamily: 'Fraunces_500Medium', fontSize: 22, fontWeight: '500', color: Colors.ink, letterSpacing: -0.3 },
  petQuote: { fontSize: 12, color: Colors.inkSoft, marginTop: 4 },
  xpBarBg: { marginTop: 10, height: 6, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  xpBarFill: { height: 6, borderRadius: 9999, backgroundColor: Colors.pinkHot },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  xpLabel: { fontSize: 10, color: Colors.inkFaint, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statCard: { flex: 1 },
  statInner: { padding: 16 },
  statVal: { fontFamily: 'Fraunces_500Medium', fontSize: 24, fontWeight: '500', color: Colors.ink, letterSpacing: -0.4 },
  statLabel: { fontSize: 9, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 8 },
  taskCard: { padding: 22 },
  eyebrow: { fontSize: 10, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6 },
  taskTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 24, fontWeight: '500', color: Colors.ink, marginTop: 8, letterSpacing: -0.3 },
  taskSub: { fontSize: 13, color: Colors.inkSoft, marginTop: 4 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 14 },
  dot: { flex: 1, height: 8, borderRadius: 9999 },
  startBtn: {
    marginTop: 16, paddingVertical: 14, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
  },
  startBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  missionCard: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  missionEmoji: { fontSize: 28 },
  missionTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  missionSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  missionCta: { fontSize: 14, fontWeight: '600', color: Colors.pinkHot },
});
