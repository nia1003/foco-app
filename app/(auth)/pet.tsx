/**
 * CompanionScreen — Choose your companion.
 * Uses real pet illustrations from assets/pets/.
 */
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createAuthSimpleStyles } from '@/styles/authForm.styles';

export default function CompanionScreen() {
  const { screenBg, colors } = useAppTheme();
  const styles = useThemedStyles(createAuthSimpleStyles);
  const router = useRouter();
  const { play } = useSound();
  const { saveOnboardingPetName } = usePetStore();
  const AVAILABLE_PETS = PETS.filter((p) => !p.locked);
  const [selected, setSelected] = useState(AVAILABLE_PETS[0].id);
  const selectedPet = AVAILABLE_PETS.find((p) => p.id === selected)!;

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />
      <View style={styles.content}>
        <FocoBar back />

        {/* Large preview of selected pet */}
        <View style={localStyles.heroWrap}>
          <View style={localStyles.heroBg}>
            <Image
              source={selectedPet.image}
              style={localStyles.heroImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[localStyles.heroName, { color: colors.ink }]}>{selectedPet.name}</Text>
          <Text style={[localStyles.heroTrait, { color: colors.inkSoft }]}>{selectedPet.trait}</Text>
        </View>

        {/* Pet selector row */}
        <View style={localStyles.selectorWrap}>
          <FrostCard radius={28} padded={false}>
            <View style={localStyles.selectorInner}>
              <Text style={[localStyles.selectorLabel, { color: colors.inkFaint }]}>Choose your companion</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={localStyles.petRow}>
                {AVAILABLE_PETS.map((pet) => {
                  const active = selected === pet.id;
                  return (
                    <TouchableOpacity
                      key={pet.id}
                      style={[
                        localStyles.petTile,
                        active && { borderColor: pet.accent, borderWidth: 2, backgroundColor: pet.accent + '20' },
                      ]}
                      onPress={() => { play('tap'); setSelected(pet.id); }}
                      activeOpacity={0.75}
                    >
                      <Image
                        source={pet.image}
                        style={localStyles.petTileImage}
                        resizeMode="contain"
                      />
                      <Text style={[localStyles.petTileName, { color: colors.inkSoft }, active && { color: colors.ink, fontWeight: '700' }]}>
                        {pet.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={localStyles.btnWrap}>
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={async () => {
                play('transition_up');
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

const localStyles = StyleSheet.create({
  heroWrap: { alignItems: 'center', marginTop: 12, marginBottom: 20 },
  heroBg: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  heroImage: { width: 170, height: 170 },
  heroName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28, fontWeight: '500', letterSpacing: -0.3,
  },
  heroTrait: { fontSize: 14, marginTop: 4 },
  selectorWrap: { flex: 1 },
  selectorInner: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 4 },
  selectorLabel: {
    fontSize: 10, fontWeight: '700',
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
  petTileName: { fontSize: 12, fontWeight: '500' },
  btnWrap: { padding: 20, paddingTop: 8 },
});
