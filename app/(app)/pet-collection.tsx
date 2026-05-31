import { Fonts } from '@/constants/fonts';
/**
 * PetCollectionScreen — 左右滑動切換寵物頁面
 * 每隻寵物全螢幕展示：大 3D 模型 + 底部資訊卡
 */
import React, { useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import { useSound } from '@/components/SoundProvider';
import { mockPets } from '@/data/mockData';
import { useAppTheme } from '@/hooks/useAppTheme';

const { width: W, height: H } = Dimensions.get('window');
const UNLOCKED = PETS.filter((p) => !p.locked);
const CARD_H = Math.round(H * 0.36);

const LEVEL_LABELS: Record<number, string> = {
  1: '新生', 2: '成長中', 3: '茁壯', 4: '強壯', 5: '傳說',
};

export default function PetCollectionScreen() {
  const { screenBg } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { pets } = usePetStore();
  const { play } = useSound();
  const [currentIndex, setCurrentIndex] = useState(0);

  const searchPool = pets.length > 0 ? pets : mockPets;

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / W);
    if (page !== currentIndex) play('tap');
    setCurrentIndex(page);
  };

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />

      {/* FocoBar */}
      <View style={[styles.barWrap, { paddingTop: insets.top }]}>
        <FocoBar back />
      </View>

      {/* Dot indicators */}
      <View style={[styles.dotsWrap, { top: 50 + insets.top }]}>
        {UNLOCKED.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Horizontal pager */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.pager}
      >
        {UNLOCKED.map((petDef, idx) => {
          const storePet =
            searchPool.find((p) => p.name.toLowerCase() === petDef.id) ??
            searchPool[idx] ??
            mockPets[0];
          const level = Math.min(Math.max(storePet.level, 1), 5) as 1 | 2 | 3 | 4 | 5;
          const xpPct = storePet.xp_next_level > 0 ? storePet.xp / storePet.xp_next_level : 0;

          return (
            <View key={petDef.id} style={styles.page}>
              {/* 3D pet — 留左右各 10% 寬度讓 ScrollView 捕捉換頁手勢 */}
              <View
                pointerEvents="box-none"
                style={[
                  styles.petArea,
                  { top: 80 + insets.top, bottom: CARD_H + 12 },
                ]}
              >
                <PetRenderer pet={petDef} size={260} interactive />
              </View>

              {/* Bottom info card */}
              <View
                style={[
                  styles.cardWrap,
                  { height: CARD_H, paddingBottom: tabBarHeight + 8 },
                ]}
              >
                <FrostCard radius={32} padded={false}>
                  <View style={styles.cardContent}>
                    <Text style={styles.petName}>{petDef.name}</Text>
                    <Text style={styles.petTrait}>{petDef.trait}</Text>

                    <View style={styles.levelRow}>
                      <View style={styles.levelBadge}>
                        <Text style={[styles.levelBadgeText, { color: petDef.accent }]}>
                          Lv.{level} · {LEVEL_LABELS[level]}
                        </Text>
                      </View>
                      <Text style={styles.xpNums}>{storePet.xp} / {storePet.xp_next_level} XP</Text>
                    </View>

                    <View style={styles.xpBarBg}>
                      <View
                        style={[
                          styles.xpBarFill,
                          {
                            width: `${Math.min(xpPct * 100, 100)}%` as any,
                            backgroundColor: petDef.accent,
                          },
                        ]}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.detailBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        play('transition_up');
                        router.push({
                          pathname: '/(app)/pet-info',
                          params: { petId: petDef.id },
                        });
                      }}
                    >
                      <Text style={styles.detailBtnText}>查看詳情 →</Text>
                    </TouchableOpacity>
                  </View>
                </FrostCard>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  barWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
  },

  dotsWrap: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    zIndex: 10,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(20,16,28,0.18)',
  },
  dotActive: {
    width: 20, borderRadius: 3,
    backgroundColor: Colors.ink,
  },

  pager: { flex: 1 },

  page: {
    width: W,
    height: H,
  },

  petArea: {
    position: 'absolute',
    // 留左右各 ~65px 讓 ScrollView 捕捉換頁手勢
    left: Math.round(W * 0.16),
    right: Math.round(W * 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
  },

  cardContent: { padding: 22, paddingBottom: 18 },

  petName: {
    fontFamily: Fonts.display,
    fontSize: 30, fontWeight: '500',
    color: Colors.ink, letterSpacing: -0.4,
    marginBottom: 2,
  },
  petTrait: {
    fontSize: 14, color: Colors.inkSoft,
    marginBottom: 14,
  },

  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  levelBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(20,16,28,0.10)',
  },
  levelBadgeText: { fontSize: 12, fontWeight: '700' },
  xpNums: { fontSize: 12, color: Colors.inkSoft, fontWeight: '500' },

  xpBarBg: {
    height: 6, borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    overflow: 'hidden',
    marginBottom: 18,
  },
  xpBarFill: { height: '100%', borderRadius: 9999 },

  detailBtn: {
    alignSelf: 'center',
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: Colors.ink,
  },
  detailBtnText: {
    fontSize: 13, fontWeight: '700',
    color: '#fff', letterSpacing: 1.2,
  },
});
