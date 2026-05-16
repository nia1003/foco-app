/**
 * HomeScreen — daily dashboard hub (FOCO 完整版)
 * - 顯示真實寵物資料（petStore / focoService）
 * - 時長選擇器（15 / 25 / 50 / 90 min）
 * - 導向 Timer 時帶入 durationMin 參數
 */
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { getPet } from '@/services/focoService';
import { mockPet } from '@/data/mockData';

const DURATION_OPTIONS = [15, 25, 50, 90];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HomeScreen() {
  const router = useRouter();
  const { userId } = useAuthStore();
  const { pet: storePet, setPet } = usePetStore();

  const [selectedDuration, setSelectedDuration] = useState(25);

  const pet = storePet ?? mockPet;
  const xpProgress = pet.xp_next_level > 0 ? pet.xp / pet.xp_next_level : 1;
  const activePet = PETS.find((p) => p.id === pet.name.toLowerCase()) ?? PETS[0];

  // Fetch real pet data
  useEffect(() => {
    if (!userId) return;
    getPet(userId)
      .then((p) => setPet(p))
      .catch(() => {}); // 後端未好時保持 mock
  }, [userId]);

  // Dynamic greeting
  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

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
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.greet}>Good morning,{'\n'}Nia.</Text>
        </View>

        {/* Pet card */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(app)/pet-info')}
            >
              <View style={styles.petCard}>
                <View style={[styles.petAvatar, { backgroundColor: activePet.accent + '30' }]}>
                  <Image source={activePet.image} style={styles.petImage} resizeMode="contain" />
                </View>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.name} · Lv.{pet.level}</Text>
                  <Text style={styles.petQuote}>"Let's focus together today."</Text>
                  <View style={styles.xpBarBg}>
                    <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` as any }]} />
                  </View>
                  <View style={styles.xpRow}>
                    <Text style={styles.xpLabel}>XP {pet.xp} / {pet.xp_next_level}</Text>
                    <Text style={styles.xpLabel}>{Math.round(xpProgress * 100)}% to next</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </FrostCard>
        </View>

        {/* Focus launcher */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.focusCard}>
              <Text style={styles.eyebrow}>START FOCUS</Text>
              <Text style={styles.focusTitle}>How long?</Text>

              {/* Duration chips */}
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={[styles.durationChip, selectedDuration === min && styles.durationChipActive]}
                    onPress={() => setSelectedDuration(min)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.durationChipText, selectedDuration === min && styles.durationChipTextActive]}>
                      {min}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.startBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/focus',
                    params: { durationMin: String(selectedDuration) },
                  })
                }
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
  // Pet card
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
  xpBarBg: { marginTop: 10, height: 6, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)', overflow: 'hidden' },
  xpBarFill: { height: 6, borderRadius: 9999, backgroundColor: Colors.pinkHot },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  xpLabel: { fontSize: 10, color: Colors.inkFaint, letterSpacing: 0.5 },
  // Focus launcher card
  focusCard: { padding: 22 },
  eyebrow: { fontSize: 10, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6 },
  focusTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 28, fontWeight: '500', color: Colors.ink, marginTop: 6, marginBottom: 16, letterSpacing: -0.3 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  durationChip: {
    flex: 1, paddingVertical: 10, borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.06)',
    borderWidth: 1, borderColor: 'transparent',
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: 'rgba(232,71,151,0.10)',
    borderColor: Colors.pinkHot,
  },
  durationChipText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },
  durationChipTextActive: { color: Colors.pinkHot },
  startBtn: {
    paddingVertical: 14, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
  },
  startBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  // Mission promo
  missionCard: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  missionEmoji: { fontSize: 28 },
  missionTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  missionSub: { fontSize: 12, color: Colors.inkSoft, marginTop: 2 },
  missionCta: { fontSize: 14, fontWeight: '600', color: Colors.pinkHot },
});
