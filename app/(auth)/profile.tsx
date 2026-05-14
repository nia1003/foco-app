/**
 * ProfileScreen — Focus goal selection (2×2 grid).
 * iOS 26: SoftWallpaper + FrostCard.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';

const GOALS = [
  { id: 'study', label: '📚 Study', sub: 'Coursework & research' },
  { id: 'work', label: '💼 Work', sub: 'Deep work & projects' },
  { id: 'create', label: '🎨 Create', sub: 'Art, writing & music' },
  { id: 'habits', label: '🌱 Habits', sub: 'Daily routines' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>('study');

  return (
    <View style={styles.root}>
      <AppBackground />
      <View style={styles.content}>
        <FocoBar back />

        <View style={styles.cardWrap}>
          <FrostCard radius={32}>
            <Text style={styles.heading}>What's your main focus?</Text>
            <Text style={styles.sub}>We'll personalise your experience.</Text>

            <View style={styles.grid}>
              {GOALS.map((g) => {
                const active = selected === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.tile, active && styles.tileActive]}
                    onPress={() => setSelected(g.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.tileEmoji}>{g.label.split(' ')[0]}</Text>
                    <Text style={[styles.tileLabel, active && styles.tileLabelActive]}>
                      {g.label.split(' ').slice(1).join(' ')}
                    </Text>
                    <Text style={styles.tileSub}>{g.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => router.push('/(auth)/pet')}
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
  cardWrap: { marginTop: 8 },
  heading: { fontFamily: 'Fraunces_500Medium', fontSize: 26, fontWeight: '500', color: Colors.ink, letterSpacing: -0.3 },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  tile: {
    width: '47%',
    padding: 16, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  tileActive: {
    backgroundColor: 'rgba(232,71,151,0.12)',
    borderColor: 'rgba(232,71,151,0.4)',
  },
  tileEmoji: { fontSize: 24, marginBottom: 6 },
  tileLabel: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  tileLabelActive: { color: Colors.pinkHot },
  tileSub: { fontSize: 11, color: Colors.inkFaint, marginTop: 2 },
  continueBtn: {
    marginTop: 24, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3 },
});
