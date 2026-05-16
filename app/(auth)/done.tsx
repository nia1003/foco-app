/**
 * DoneScreen — Onboarding complete.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';

export default function DoneScreen() {
  const router = useRouter();
  const { play } = useSound();

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar back />

      <View style={styles.content}>
        {/* Halo + sparkle */}
        <View style={styles.heroWrap}>
          <View style={styles.halo} />
          <Text style={styles.heroEmoji}>✦</Text>
          <View style={styles.sparkles}>
            <Text style={[styles.sparkle, { top: -10, left: 10, fontSize: 14 }]}>✦</Text>
            <Text style={[styles.sparkle, { top: 10, right: 10, fontSize: 10 }]}>✦</Text>
            <Text style={[styles.sparkle, { bottom: 0, left: 30, fontSize: 18 }]}>✦</Text>
          </View>
        </View>

        <Text style={styles.heading}>You're all set!</Text>
        <Text style={styles.sub}>
          Your account is ready.{'\n'}Time to start focusing.
        </Text>

        <View style={styles.cardWrap}>
          <FrostCard radius={24}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>0</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>Lv.1</Text>
                <Text style={styles.statLabel}>Pet</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>0</Text>
                <Text style={styles.statLabel}>Day streak</Text>
              </View>
            </View>
          </FrostCard>
        </View>

        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => { play('transition_up'); router.replace('/(app)/home'); }}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>START FOCUSING</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  content: {
    flex: 1, paddingHorizontal: 22, paddingTop: 40,
    alignItems: 'center',
  },
  heroWrap: {
    width: 120, height: 120,
    position: 'relative', alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  halo: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.pinkHot, opacity: 0.15,
  },
  heroEmoji: { fontSize: 40, color: Colors.pinkHot },
  sparkles: { position: 'absolute', width: '100%', height: '100%' },
  sparkle: { position: 'absolute', color: Colors.pinkHot },
  heading: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 32, fontWeight: '600', color: Colors.ink,
    letterSpacing: -0.5, textAlign: 'center',
  },
  sub: {
    fontSize: 15, color: Colors.inkSoft, marginTop: 10,
    textAlign: 'center', lineHeight: 22,
  },
  cardWrap: { width: '100%', marginTop: 32 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '700', color: Colors.ink },
  statLabel: { fontSize: 11, color: Colors.inkFaint, marginTop: 2, letterSpacing: 0.5 },
  statDivider: { width: 0.5, height: 32, backgroundColor: 'rgba(20,16,28,0.1)' },
  startBtn: {
    marginTop: 32, width: '100%', paddingVertical: 18, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  startBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3 },
});
