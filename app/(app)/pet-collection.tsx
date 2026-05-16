/**
 * PetCollectionScreen — 寵物一覽
 * 2×2 grid：目前有 Xingwang + Penguin，另外兩格 Coming Soon
 */
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';

// Collect the 4 slots: real pets first, then coming-soon
const UNLOCKED = PETS.filter((p) => !p.locked);
const LOCKED   = PETS.filter((p) =>  p.locked);

// Always show exactly 4 slots
const COMING_SOON = [
  { id: 'cs1', name: '???', trait: 'Coming soon…', accent: '#ccc' },
  { id: 'cs2', name: '???', trait: 'Coming soon…', accent: '#ccc' },
];
const LOCKED_SLOTS = [...LOCKED, ...COMING_SOON].slice(0, Math.max(0, 4 - UNLOCKED.length));

export default function PetCollectionScreen() {
  const router = useRouter();

  const slots: Array<
    | { kind: 'pet'; data: (typeof PETS)[0] }
    | { kind: 'locked'; data: { id: string; name: string; trait: string; accent: string } }
  > = [
    ...UNLOCKED.map((p) => ({ kind: 'pet' as const, data: p })),
    ...LOCKED_SLOTS.map((p) => ({ kind: 'locked' as const, data: p })),
  ];

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar back />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Pets</Text>
        <Text style={styles.subtitle}>
          {UNLOCKED.length} / 4 collected
        </Text>

        <View style={styles.grid}>
          {slots.map((slot) => {
            if (slot.kind === 'pet') {
              const pet = slot.data;
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.cellWrap}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/pet-info',
                      params: { petId: pet.id },
                    })
                  }
                >
                  <FrostCard radius={24} padded={false}>
                    <View style={styles.cell}>
                      <View style={styles.petPreview}>
                        <PetRenderer pet={pet} size={110} />
                      </View>
                      <Text style={styles.cellName}>{pet.name}</Text>
                      <Text style={styles.cellTrait}>{pet.trait}</Text>
                      <View style={[styles.accentDot, { backgroundColor: pet.accent }]} />
                    </View>
                  </FrostCard>
                </TouchableOpacity>
              );
            }

            // Locked / coming soon
            return (
              <View key={slot.data.id} style={styles.cellWrap}>
                <View style={[styles.cellLocked]}>
                  <Text style={styles.lockIcon}>🔒</Text>
                  <Text style={styles.cellName} numberOfLines={1}>{slot.data.name}</Text>
                  <Text style={styles.cellTrait}>{slot.data.trait}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.footer}>More pets coming in future updates!</Text>
      </ScrollView>
    </View>
  );
}

const CELL_GAP = 12;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 80 },

  title: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 42,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.inkSoft,
    marginTop: 2,
    marginBottom: 20,
  },

  // 2×2 grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cellWrap: {
    width: `${(100 - CELL_GAP / 2) / 2}%` as any,
  },

  // Unlocked cell
  cell: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  petPreview: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.ink,
    marginTop: 10,
    letterSpacing: -0.2,
  },
  cellTrait: {
    fontSize: 11,
    color: Colors.inkSoft,
    marginTop: 3,
    textAlign: 'center',
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 10,
  },

  // Locked cell
  cellLocked: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(20,16,28,0.12)',
    backgroundColor: 'rgba(20,16,28,0.03)',
    minHeight: 200,
    justifyContent: 'center',
  },
  lockIcon: { fontSize: 28, marginBottom: 10, opacity: 0.35 },

  footer: {
    fontSize: 12,
    color: Colors.inkFaint,
    textAlign: 'center',
    marginTop: 28,
  },
});
