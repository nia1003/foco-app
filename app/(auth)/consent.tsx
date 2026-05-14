/**
 * ConsentScreen — "A few quick things" (ToS / Privacy / Notifications checklist).
 * iOS 26: SoftWallpaper + FrostCard.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';

function ConsentItem({ label }: { label: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.check}>
        <Text style={styles.checkIcon}>✓</Text>
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </View>
  );
}

export default function ConsentScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <AppBackground />
      <View style={styles.content}>
        <FocoBar back />

        <View style={styles.cardWrap}>
          <FrostCard radius={32}>
            <Text style={styles.heading}>A few quick things</Text>
            <Text style={styles.sub}>Please review and accept to continue your journey.</Text>

            <View style={styles.list}>
              <ConsentItem label="Terms of Service" />
              <View style={styles.divider} />
              <ConsentItem label="Privacy Policy" />
              <View style={styles.divider} />
              <ConsentItem label="Notifications" />
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => router.push('/(auth)/done')}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
  cardWrap: { marginTop: 28 },
  heading: { fontFamily: 'Fraunces_500Medium', fontSize: 26, fontWeight: '500', color: Colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6 },
  list: { marginTop: 24 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12,
  },
  check: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  checkIcon: { fontSize: 13, color: '#fff', fontWeight: '700' },
  itemLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.ink },
  chevron: { fontSize: 18, color: Colors.inkFaint },
  divider: {
    height: 0.5, backgroundColor: 'rgba(20,16,28,0.08)', marginLeft: 42,
  },
  continueBtn: {
    marginTop: 26, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 12,
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3 },
});
