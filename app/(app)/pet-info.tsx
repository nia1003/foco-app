/**
 * PetInfoScreen — 寵物詳情頁
 * 顯示：等級、XP 進度條、寵物圖片（scale 隨等級放大）、特性說明
 */
import React from 'react';
import {
  Image,
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
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import { mockPet } from '@/data/mockData';

// 等級對應的寵物 scale 和描述
const LEVEL_INFO: Record<number, { scale: number; label: string; desc: string }> = {
  1: { scale: 0.7,  label: '新生',   desc: '剛開始旅程，充滿好奇心！' },
  2: { scale: 0.85, label: '成長中', desc: '開始有自己的節奏，越來越有活力！' },
  3: { scale: 1.0,  label: '茁壯',   desc: '已經掌握專注的訣竅，穩健前進！' },
  4: { scale: 1.1,  label: '強壯',   desc: '令人印象深刻的專注力，繼續保持！' },
  5: { scale: 1.2,  label: '傳說',   desc: '已達到最高等級，真正的專注大師！' },
};

export default function PetInfoScreen() {
  const router = useRouter();
  const { pet: storePet } = usePetStore();
  const pet = storePet ?? mockPet;  // 後端未好就用 mock

  const level = Math.min(Math.max(pet.level, 1), 5) as 1 | 2 | 3 | 4 | 5;
  const info = LEVEL_INFO[level];
  const xpProgress = pet.xp_next_level > 0 ? pet.xp / pet.xp_next_level : 1;

  // 找對應的寵物圖片（以 pet.name 小寫比對 PETS id）
  const petDef = PETS.find((p) => p.id === pet.name.toLowerCase()) ?? PETS[0];

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar back />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 寵物展示區 */}
        <View style={styles.petStage}>
          <View style={[styles.petGlow, { backgroundColor: petDef.accent + '30' }]}>
            <Image
              source={petDef.image}
              style={[styles.petImage, { transform: [{ scale: info.scale }] }]}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.petName}>{pet.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv.{level} · {info.label}</Text>
          </View>
        </View>

        {/* XP 進度卡 */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Experience</Text>
                <Text style={styles.xpNumbers}>
                  {pet.xp} <Text style={styles.xpMax}>/ {pet.xp_next_level} XP</Text>
                </Text>
              </View>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} />
              </View>
              {level < 5 && (
                <Text style={styles.xpHint}>
                  再 {pet.xp_next_level - pet.xp} XP 升到 Lv.{level + 1}
                </Text>
              )}
              {level === 5 && (
                <Text style={styles.xpHint}>已達最高等級 🏆</Text>
              )}
            </View>
          </FrostCard>
        </View>

        {/* 個性說明卡 */}
        <View style={styles.section}>
          <FrostCard radius={24}>
            <Text style={styles.traitTitle}>個性</Text>
            <Text style={styles.traitValue}>{petDef.trait}</Text>
            <Text style={styles.traitDesc}>{info.desc}</Text>
          </FrostCard>
        </View>

        {/* 等級路線 */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.roadmapCard}>
              <Text style={styles.roadmapTitle}>成長路線</Text>
              {Object.entries(LEVEL_INFO).map(([lv, d]) => {
                const lvNum = Number(lv);
                const reached = lvNum <= level;
                return (
                  <View key={lv} style={styles.roadmapRow}>
                    <View style={[styles.roadmapDot, reached && styles.roadmapDotActive]} />
                    <Text style={[styles.roadmapLv, reached && styles.roadmapLvActive]}>
                      Lv.{lv}
                    </Text>
                    <Text style={[styles.roadmapLabel, reached && styles.roadmapLabelActive]}>
                      {d.label}
                    </Text>
                    {lvNum === level && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>現在</Text>
                      </View>
                    )}
                  </View>
                );
              })}
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
  content: { paddingHorizontal: 18, paddingBottom: 60 },
  petStage: { alignItems: 'center', marginTop: 8, marginBottom: 4 },
  petGlow: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  petImage: { width: 120, height: 120 },
  petName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 32,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  levelBadge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(232,71,151,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(232,71,151,0.25)',
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.pinkHot,
    letterSpacing: 0.3,
  },
  section: { marginTop: 12 },
  xpCard: { padding: 20 },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  xpLabel: { fontSize: 12, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1 },
  xpNumbers: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    fontWeight: '500',
    color: Colors.ink,
  },
  xpMax: { fontSize: 14, fontWeight: '400', color: Colors.inkSoft },
  xpBarBg: {
    height: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: Colors.pinkHot,
  },
  xpHint: { fontSize: 11, color: Colors.inkFaint, marginTop: 8, textAlign: 'right' },
  traitTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  traitValue: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 20,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  traitDesc: {
    fontSize: 13,
    color: Colors.inkSoft,
    marginTop: 6,
    lineHeight: 19,
  },
  roadmapCard: { padding: 20 },
  roadmapTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  roadmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  roadmapDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(20,16,28,0.12)',
  },
  roadmapDotActive: { backgroundColor: Colors.pinkHot },
  roadmapLv: { fontSize: 12, color: Colors.inkFaint, width: 36 },
  roadmapLvActive: { color: Colors.ink, fontWeight: '700' },
  roadmapLabel: { flex: 1, fontSize: 13, color: Colors.inkFaint },
  roadmapLabelActive: { color: Colors.ink },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(232,71,151,0.12)',
  },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.pinkHot },
});
