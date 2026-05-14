/**
 * SanctuaryScreen (My Space) — pet companion, habitat, backpack entry.
 * iOS 26: FocoWallpaper + Glass cards. Matches "Farm" in design file.
 */
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { Glass } from '@/components/ui/Glass';
import { FocoBar } from '@/components/layout/FocoBar';
import { TabBar } from '@/components/layout/TabBar';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';

const activePet = PETS[0];

export default function SanctuaryScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar avatar="N" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Habitat scene */}
        <View style={styles.habitatCard}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.habitatInner}>
              {/* Sky */}
              <View style={styles.sky}>
                <Text style={styles.skyDecor}>☁️   ☁️</Text>
              </View>
              {/* Ground scene */}
              <View style={styles.ground}>
                <Text style={styles.groundDecor}>🌿 🌸 🌿 🌸 🌿</Text>
              </View>
              {/* Pet center-stage */}
              <View style={styles.petStage}>
                <View style={[styles.petBubble, { backgroundColor: activePet.accent + '28' }]}>
                  <Image source={activePet.image} style={styles.petBig} resizeMode="contain" />
                </View>
                <Text style={styles.petCaption}>Mochi feels happy!</Text>
              </View>
            </View>
          </FrostCard>
        </View>

        {/* Pet info */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.petInfo}>
              <View>
                <Text style={styles.petName}>Mochi</Text>
                <Text style={styles.petSub}>Bunny · Level 3</Text>
              </View>
              <View style={styles.petStats}>
                <View style={styles.petStatItem}>
                  <Text style={styles.petStatVal}>72%</Text>
                  <Text style={styles.petStatLabel}>Energy</Text>
                </View>
                <View style={styles.petStatItem}>
                  <Text style={styles.petStatVal}>156</Text>
                  <Text style={styles.petStatLabel}>XP</Text>
                </View>
                <View style={styles.petStatItem}>
                  <Text style={styles.petStatVal}>3🔥</Text>
                  <Text style={styles.petStatLabel}>Streak</Text>
                </View>
              </View>
            </View>
            <View style={styles.xpBarWrap}>
              <View style={styles.xpBg}>
                <View style={[styles.xpFill, { width: '64%' }]} />
              </View>
              <Text style={styles.xpLabel}>156 / 240 XP to Level 4</Text>
            </View>
          </FrostCard>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {[
            { emoji: '🎁', label: 'Backpack', onPress: () => router.push('/(app)/backpack' as any) },
            { emoji: '🥕', label: 'Feed', onPress: () => {} },
            { emoji: '🛁', label: 'Groom', onPress: () => {} },
            { emoji: '🎮', label: 'Play', onPress: () => {} },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionBtn} onPress={a.onPress} activeOpacity={0.75}>
              <Glass radius={20} tone="chrome" padded={false}>
                <View style={styles.actionInner}>
                  <Text style={styles.actionEmoji}>{a.emoji}</Text>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </View>
              </Glass>
            </TouchableOpacity>
          ))}
        </View>

        {/* Visitor friends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visitor friends today</Text>
          <View style={styles.visitors}>
            {['🦊', '🐻', '🐱'].map((emoji, i) => (
              <View key={i} style={styles.visitorBadge}>
                <Text style={styles.visitorEmoji}>{emoji}</Text>
              </View>
            ))}
            <Text style={styles.visitorsLabel}>+2 more</Text>
          </View>
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
  habitatCard: { marginTop: 8 },
  habitatInner: { height: 200, position: 'relative', overflow: 'hidden' },
  sky: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  skyDecor: { fontSize: 24, opacity: 0.6 },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' },
  groundDecor: { fontSize: 20 },
  petStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  petBubble: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.8)',
  },
  petBig: { width: 70, height: 70 },
  petCaption: { fontSize: 13, color: Colors.inkSoft, marginTop: 8 },
  section: { marginTop: 12 },
  petInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingBottom: 14,
  },
  petName: { fontSize: 22, fontWeight: '600', color: Colors.ink },
  petSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  petStats: { flexDirection: 'row', gap: 16 },
  petStatItem: { alignItems: 'center' },
  petStatVal: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  petStatLabel: { fontSize: 9, color: Colors.inkFaint, letterSpacing: 0.5, marginTop: 1 },
  xpBarWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  xpBg: { height: 6, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)' },
  xpFill: { height: 6, borderRadius: 9999, backgroundColor: Colors.pinkHot },
  xpLabel: { fontSize: 10, color: Colors.inkFaint, marginTop: 5 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1 },
  actionInner: { alignItems: 'center', padding: 14, gap: 6 },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: Colors.ink },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.inkSoft, marginBottom: 10 },
  visitors: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  visitorBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  visitorEmoji: { fontSize: 22 },
  visitorsLabel: { fontSize: 12, color: Colors.inkSoft },
});
