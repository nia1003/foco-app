/**
 * CompanionScreen — Choose your companion.
 * Uses real pet illustrations from assets/pets/.
 */
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';

export default function CompanionScreen() {
  const router = useRouter();
  const { saveOnboardingPetName } = usePetStore();
  const [selected, setSelected] = useState(PETS[0].id);
  const selectedPet = PETS.find((p) => p.id === selected)!;

  return (
    <View style={styles.root}>
      <AppBackground />
      <View style={styles.content}>
        <FocoBar back />

        {/* Large preview of selected pet */}
        <View style={styles.heroWrap}>
          <View style={[styles.heroBg, { backgroundColor: selectedPet.accent + '30' }]}>
            <Image
              source={selectedPet.image}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroName}>{selectedPet.name}</Text>
          <Text style={styles.heroTrait}>{selectedPet.trait}</Text>
        </View>

        {/* Pet selector row */}
        <View style={styles.selectorWrap}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.selectorInner}>
              <Text style={styles.selectorLabel}>Choose your companion</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
                {PETS.map((pet) => {
                  const active = selected === pet.id;
                  return (
                    <TouchableOpacity
                      key={pet.id}
                      style={[
                        styles.petTile,
                        active && { borderColor: pet.accent, borderWidth: 2, backgroundColor: pet.accent + '20' },
                      ]}
                      onPress={() => setSelected(pet.id)}
                      activeOpacity={0.75}
                    >
                      <Image
                        source={pet.image}
                        style={styles.petTileImage}
                        resizeMode="contain"
                      />
                      <Text style={[styles.petTileName, active && { color: Colors.ink, fontWeight: '700' }]}>
                        {pet.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.btnWrap}>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={async () => {
                await saveOnboardingPetName(selectedPet.name);
                router.push({ pathname: '/(auth)/consent', params: { petId: selected } });
              }}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>CONTINUE →</Text>
              </TouchableOpacity>
            </View>
          </FrostCard>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
  heroWrap: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  heroBg: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  heroImage: { width: 170, height: 170 },
  heroName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28, fontWeight: '500', color: Colors.ink, letterSpacing: -0.3,
  },
  heroTrait: { fontSize: 14, color: Colors.inkSoft, marginTop: 4 },
  selectorWrap: { flex: 1 },
  selectorInner: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 4 },
  selectorLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.inkFaint,
    letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 14,
  },
  petRow: { flexDirection: 'row', gap: 10, paddingBottom: 8 },
  petTile: {
    width: 88, alignItems: 'center', padding: 10, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    gap: 6,
  },
  petTileImage: { width: 60, height: 60 },
  petTileName: { fontSize: 12, fontWeight: '500', color: Colors.inkSoft },
  btnWrap: { padding: 20, paddingTop: 8 },
  continueBtn: {
    paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3 },
});
