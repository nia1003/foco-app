/**
 * HomeScreen — daily dashboard hub (FOCO 完整版)
 * - 橫向寵物選擇器：點擊 = 設為今日夥伴，長按 = 查看詳情
 * - 永遠顯示所有寵物（merge real data onto mockPets template）
 * - 時長選擇器（15 / 25 / 50 / 90 min）
 * - Focus 卡顯示「今日夥伴: [name]」
 */
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
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
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { getPets } from '@/services/focoService';
import { mockPets } from '@/data/mockData';
import type { FocoPet } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const PET_CARD_W = Math.round(SCREEN_W * 0.58);

const DURATION_OPTIONS = [15, 25, 50, 90];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function mergeWithMock(real: FocoPet[]): FocoPet[] {
  return mockPets.map((mock) => {
    const found = real.find(
      (r) => r.name.toLowerCase() === mock.name.toLowerCase() || r.id === mock.id,
    );
    return found ?? mock;
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, setActivePet, restoreActivePet } = usePetStore();

  const [selectedDuration, setSelectedDuration] = useState(25);
  const [selectFeedback, setSelectFeedback] = useState<string | null>(null);

  const displayPets: FocoPet[] = pets.length > 0 ? mergeWithMock(pets) : mockPets;

  useEffect(() => {
    if (!userId) return;
    getPets(userId)
      .then((fetched) => {
        setPets(fetched);
        restoreActivePet();
      })
      .catch(() => {
        setPets(mockPets);
      });
  }, [userId]);

  const handleSelectPet = async (p: FocoPet, defName: string) => {
    await setActivePet(p.id);
    setSelectFeedback(defName);
    setTimeout(() => setSelectFeedback(null), 1800);
  };

  const now = new Date();
  const dateStr   = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  const hour      = now.getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = userName ?? userEmail?.split('@')[0] ?? 'there';

  // Resolve the active pet's display name for the focus launcher
  const activeDef =
    activePet
      ? PETS.find((d) => d.id === activePet.name.toLowerCase()) ??
        PETS.find((d) => d.id === 'xingwang') ??
        PETS[0]
      : displayPets.length > 0
        ? PETS.find((d) => d.id === displayPets[0].name.toLowerCase()) ?? PETS[0]
        : PETS[0];

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar avatar={displayName[0]?.toUpperCase() ?? '?'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ───────────────────────────── */}
        <View style={styles.greeting}>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.greet}>{timeGreet},{'\n'}{displayName}.</Text>
        </View>

        {/* ── Pet Selector ───────────────────────── */}
        <View style={styles.selectorSection}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorEyebrow}>今天的夥伴</Text>
            <TouchableOpacity
              onPress={() => router.push('/(app)/pet-collection' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectorAll}>全部 →</Text>
            </TouchableOpacity>
          </View>

          {/* Selection feedback toast */}
          {selectFeedback && (
            <View style={styles.feedbackToast}>
              <Text style={styles.feedbackText}>✦ {selectFeedback} 將陪你專注</Text>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petRow}
            decelerationRate="fast"
            snapToInterval={PET_CARD_W + 12}
            snapToAlignment="start"
          >
            {displayPets.map((p) => {
              const def =
                PETS.find((d) => d.id === p.name.toLowerCase()) ??
                PETS.find((d) => d.id === 'xingwang') ??
                PETS[0];
              const isActive =
                activePet?.id === p.id ||
                (!activePet && p.id === displayPets[0].id);
              const xpPct = p.xp_next_level > 0 ? p.xp / p.xp_next_level : 0;

              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.petCard, { width: PET_CARD_W }, isActive && styles.petCardActive]}
                  onPress={() => handleSelectPet(p, def.name)}
                  onLongPress={() =>
                    router.push({
                      pathname: '/(app)/pet-info',
                      params: { petId: def.id },
                    })
                  }
                  activeOpacity={0.88}
                >
                  {/* 陪伴中 badge */}
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: def.accent + '22', borderColor: def.accent + '55' }]}>
                      <Text style={[styles.activeBadgeText, { color: def.accent }]}>陪伴中 ✦</Text>
                    </View>
                  )}

                  {/* 3D Pet */}
                  <View style={styles.petPreview}>
                    <PetRenderer pet={def} size={150} interactive={false} />
                  </View>

                  <Text style={styles.petCardName}>{def.name}</Text>
                  <View style={[styles.levelPill, { backgroundColor: def.accent + '22' }]}>
                    <Text style={[styles.levelPillText, { color: def.accent }]}>Lv.{p.level}</Text>
                  </View>

                  {/* XP bar */}
                  <View style={styles.xpBarBg}>
                    <View
                      style={[
                        styles.xpBarFill,
                        { width: `${Math.min(xpPct * 100, 100)}%` as any, backgroundColor: def.accent },
                      ]}
                    />
                  </View>
                  <Text style={styles.xpText}>{p.xp} / {p.xp_next_level} XP</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.selectorHint}>點擊選為今日夥伴 · 長按查看詳情</Text>
        </View>

        {/* ── Focus Launcher ─────────────────────── */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.focusCard}>
              <Text style={styles.eyebrow}>START FOCUS</Text>
              <Text style={styles.focusTitle}>How long?</Text>

              {/* Active companion indicator */}
              <View style={[styles.companionRow, { borderColor: activeDef.accent + '55' }]}>
                <View style={[styles.companionDot, { backgroundColor: activeDef.accent }]} />
                <Text style={styles.companionLabel}>今日夥伴</Text>
                <Text style={[styles.companionName, { color: activeDef.accent }]}>{activeDef.name}</Text>
              </View>

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  greeting: { marginTop: 8, paddingHorizontal: 22, paddingBottom: 4 },
  date:  { fontSize: 13, color: Colors.inkSoft },
  greet: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 32, fontWeight: '500',
    color: Colors.ink, marginTop: 4,
    letterSpacing: -0.4, lineHeight: 38,
  },

  selectorSection: { marginTop: 20 },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  selectorEyebrow: {
    fontSize: 11, fontWeight: '700',
    color: Colors.inkFaint, letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  selectorAll: {
    fontSize: 13, fontWeight: '600', color: Colors.pinkText,
  },

  feedbackToast: {
    marginHorizontal: 22,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: Colors.pinkHot,
    alignSelf: 'flex-start',
  },
  feedbackText: {
    fontSize: 12, fontWeight: '600', color: Colors.pinkText,
  },

  selectorHint: {
    fontSize: 11, color: Colors.inkFaint,
    textAlign: 'center', marginTop: 10,
    letterSpacing: 0.3,
  },

  petRow: {
    paddingHorizontal: 22,
    gap: 12,
  },

  petCard: {
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    overflow: 'visible',
  },
  petCardActive: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  activeBadge: {
    position: 'absolute',
    top: 8, right: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  activeBadgeText: {
    fontSize: 9, fontWeight: '700', letterSpacing: 0.3,
  },

  petPreview: {
    width: 150, height: 150,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    marginTop: 4,
  },

  petCardName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 17, fontWeight: '500',
    color: Colors.ink, letterSpacing: -0.2,
    marginBottom: 5,
  },

  levelPill: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 9999,
    marginBottom: 10,
  },
  levelPillText: { fontSize: 10, fontWeight: '700' },

  xpBarBg: {
    width: '100%', height: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpBarFill: { height: 4, borderRadius: 9999 },
  xpText: { fontSize: 9, color: Colors.inkFaint, letterSpacing: 0.2 },

  section: { marginTop: 14, paddingHorizontal: 18 },

  focusCard: { padding: 22 },
  eyebrow: {
    fontSize: 10, fontWeight: '700',
    color: Colors.inkFaint, letterSpacing: 1.6,
  },
  focusTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28, fontWeight: '500',
    color: Colors.ink, marginTop: 6, marginBottom: 12, letterSpacing: -0.3,
  },

  companionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  companionDot: { width: 7, height: 7, borderRadius: 999 },
  companionLabel: { fontSize: 12, color: Colors.inkSoft, flex: 1 },
  companionName: { fontSize: 13, fontWeight: '700' },

  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  durationChip: {
    flex: 1, paddingVertical: 10, borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.06)',
    borderWidth: 1, borderColor: 'transparent',
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: 'rgba(242,206,220,0.40)',
    borderColor: Colors.pinkHot,
  },
  durationChipText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },
  durationChipTextActive: { color: Colors.pinkText },
  startBtn: {
    paddingVertical: 14, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
  },
  startBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 2 },
});
