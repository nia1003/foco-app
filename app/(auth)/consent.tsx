/**
 * ConsentScreen — "A few quick things" (ToS / Privacy / Notifications checklist).
 * iOS 26: SoftWallpaper + FrostCard.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createAuthSimpleStyles } from '@/styles/authForm.styles';

function ConsentItem({ label }: { label: string }) {
  const { colors, surfaces } = useAppTheme();
  return (
    <View style={localStyles.item}>
      <View style={[localStyles.check, { backgroundColor: surfaces.ctaBg }]}>
        <Text style={[localStyles.checkIcon, { color: surfaces.ctaText }]}>✓</Text>
      </View>
      <Text style={[localStyles.itemLabel, { color: colors.ink }]}>{label}</Text>
      <Text style={[localStyles.chevron, { color: colors.inkFaint }]}>›</Text>
    </View>
  );
}

export default function ConsentScreen() {
  const { screenBg } = useAppTheme();
  const styles = useThemedStyles(createAuthSimpleStyles);
  const router = useRouter();
  const { play } = useSound();
  const { petId } = useLocalSearchParams<{ petId?: string }>();

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />
      <View style={styles.content}>
        <FocoBar back />

        <View style={[styles.cardWrap, localStyles.cardWrap]}>
          <FrostCard radius={32}>
            <Text style={styles.heading}>A few quick things</Text>
            <Text style={styles.sub}>Please review and accept to continue your journey.</Text>

            <View style={localStyles.list}>
              <ConsentItem label="Terms of Service" />
              <View style={localStyles.divider} />
              <ConsentItem label="Privacy Policy" />
              <View style={localStyles.divider} />
              <ConsentItem label="Notifications" />
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => { play('transition_up'); router.push({ pathname: '/(auth)/done', params: { petId } }); }}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>CONTINUE →</Text>
            </TouchableOpacity>
          </FrostCard>
        </View>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  cardWrap: { marginTop: 28 },
  list: { marginTop: 24 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12,
  },
  check: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  checkIcon: { fontSize: 13, fontWeight: '700' },
  itemLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  chevron: { fontSize: 18 },
  divider: {
    height: 0.5, backgroundColor: 'rgba(20,16,28,0.08)', marginLeft: 42,
  },
});
