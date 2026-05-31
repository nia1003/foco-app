import { Fonts } from '@/constants/fonts';
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
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createAuthSimpleStyles } from '@/styles/authForm.styles';

export default function DoneScreen() {
  const { screenBg, colors } = useAppTheme();
  const styles = useThemedStyles(createAuthSimpleStyles);
  const router = useRouter();
  const { play } = useSound();

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />
      <FocoBar back />

      <View style={localStyles.content}>
        {/* Halo + sparkle */}
        <View style={localStyles.heroWrap}>
          <View style={localStyles.halo} />
          <Text style={localStyles.heroEmoji}>✦</Text>
          <View style={localStyles.sparkles}>
            <Text style={[localStyles.sparkle, { top: -10, left: 10, fontSize: 14 }]}>✦</Text>
            <Text style={[localStyles.sparkle, { top: 10, right: 10, fontSize: 10 }]}>✦</Text>
            <Text style={[localStyles.sparkle, { bottom: 0, left: 30, fontSize: 18 }]}>✦</Text>
          </View>
        </View>

        <Text style={[localStyles.heading, { color: colors.ink }]}>You're all set!</Text>
        <Text style={[localStyles.sub, { color: colors.inkSoft }]}>
          Your account is ready.{'\n'}Time to start focusing.
        </Text>

        <View style={localStyles.cardWrap}>
          <FrostCard radius={24}>
            <View style={localStyles.statRow}>
              <View style={localStyles.stat}>
                <Text style={[localStyles.statNum, { color: colors.ink }]}>0</Text>
                <Text style={[localStyles.statLabel, { color: colors.inkFaint }]}>Sessions</Text>
              </View>
              <View style={localStyles.statDivider} />
              <View style={localStyles.stat}>
                <Text style={[localStyles.statNum, { color: colors.ink }]}>Lv.1</Text>
                <Text style={[localStyles.statLabel, { color: colors.inkFaint }]}>Pet</Text>
              </View>
              <View style={localStyles.statDivider} />
              <View style={localStyles.stat}>
                <Text style={[localStyles.statNum, { color: colors.ink }]}>0</Text>
                <Text style={[localStyles.statLabel, { color: colors.inkFaint }]}>Day streak</Text>
              </View>
            </View>
          </FrostCard>
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => { play('transition_up'); router.replace('/(app)/home'); }}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>START FOCUSING</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
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
    fontFamily: Fonts.displaySemiBold,
    fontSize: 32, fontWeight: '600',
    letterSpacing: -0.5, textAlign: 'center',
  },
  sub: {
    fontSize: 15, marginTop: 10,
    textAlign: 'center', lineHeight: 22,
  },
  cardWrap: { width: '100%', marginTop: 32 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  statDivider: { width: 0.5, height: 32, backgroundColor: 'rgba(20,16,28,0.1)' },
});
