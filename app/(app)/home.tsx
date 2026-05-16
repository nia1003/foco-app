/**
 * HomeScreen — daily dashboard hub (FOCO 完整版)
 * - 橫向寵物選擇器：透明卡片，只顯示寵物 + 等級資訊
 * - 永遠顯示所有寵物（merge real data onto mockPets template）
 * - 時長選擇器（15 / 25 / 50 / 90 min）
 * - 移除 daily quest promo card
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
// 每張卡佔螢幕 58%，第二張微微露出提示可滑動
const PET_CARD_W = Math.round(SCREEN_W * 0.58);

const DURATION_OPTIONS = [15, 25, 50, 90];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * 永遠展示所有 mockPets 定義的寵物，
 * 若後端有真實資料則覆蓋對應欄位（xp / level / xp_next_level）。
 * 這樣不管後端是否已建立所有寵物，畫面都不會缺少任何一隻。
 */
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

  // 永遠顯示兩隻寵物，real data > mock
  const displayPets: FocoPet[] = pets.length > 0 ? mergeWithMock(pets) : mockPets;

  // Fetch real pet data
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

  // 動態問候
  const now = new Date();
  const dateStr   = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  const hour      = now.getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = userName ?? userEmail?.split('@')[0] ?? 'there';

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
                  style={[styles.petCard, { width: PET_CARD_W }]}
                  onPress={() =>
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

                  {/* 3D Pet — larger, hero of the card */}
                  <View style={styles.petPreview}>
                    <PetRenderer pet={def} size={150} interactive={false} />
                  </View>

                  {/* Name + level — compact below pet */}
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

          <Text style={styles.selectorHint}>點擊查看詳情</Text>
        </View>

        {/* ── Focus Launcher ─────────────────────── */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <View style={styles.focusCard}>
              <Text style={styles.eyebrow}>START FOCUS</Text>
              <Text style={styles.focusTitle}>How long?</Text>

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

  // Greeting
  greeting: { marginTop: 8, paddingHorizontal: 22, paddingBottom: 4 },
  date:  { fontSize: 13, color: Colors.inkSoft },
  greet: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 32, fontWeight: '500',
    color: Colors.ink, marginTop: 4,
    letterSpacing: -0.4, lineHeight: 38,
  },

  // Pet selector section
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
  selectorHint: {
    fontSize: 11, color: Colors.inkFaint,
    textAlign: 'center', marginTop: 10,
    letterSpacing: 0.3,
  },

  // Horizontal pet scroll
  petRow: {
    paddingHorizontal: 22,
    gap: 12,
  },

  // Pet card — 完全透明，無背景無框
  petCard: {
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    overflow: 'visible',
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

  // Shared section spacing
  section: { marginTop: 14, paddingHorizontal: 18 },

  // Focus launcher
  focusCard: { padding: 22 },
  eyebrow: {
    fontSize: 10, fontWeight: '700',
    color: Colors.inkFaint, letterSpacing: 1.6,
  },
  focusTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28, fontWeight: '500',
    color: Colors.ink, marginTop: 6, marginBottom: 16, letterSpacing: -0.3,
  },
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
