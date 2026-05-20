import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppTheme } from '@/hooks/useAppTheme';
import type { Pet } from '@/constants/pets';
import type { FocoPet } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const PET_ITEM_W = Math.round(SCREEN_W * 0.62);
const PET_GAP = 12;
const PET_SNAP = PET_ITEM_W + PET_GAP;
const PET_SIDE_PAD = (SCREEN_W - PET_ITEM_W) / 2;
const PET_CAROUSEL_H = 268;
const SIDE_OPACITY = 0.32;
const CENTER_OPACITY = 1;
const SIDE_SCALE = 0.78;
const CENTER_SCALE = 1;

type LoopSlide = {
  key: string;
  def: Pet;
  realIndex: number;
  extIndex: number;
};

function buildLoopSlides(pets: Pet[]): LoopSlide[] {
  const n = pets.length;
  if (n === 0) return [];
  if (n === 1) {
    return [{ key: pets[0].id, def: pets[0], realIndex: 0, extIndex: 0 }];
  }
  const head = pets[n - 1];
  const tail = pets[0];
  return [
    { key: `loop-head-${head.id}`, def: head, realIndex: n - 1, extIndex: 0 },
    ...pets.map((def, i) => ({
      key: def.id,
      def,
      realIndex: i,
      extIndex: i + 1,
    })),
    { key: `loop-tail-${tail.id}`, def: tail, realIndex: 0, extIndex: n + 1 },
  ];
}

function realIndexFromOffset(offsetX: number, petCount: number): number {
  if (petCount <= 0) return 0;
  if (petCount === 1) return 0;
  const extIdx = Math.round(offsetX / PET_SNAP);
  if (extIdx <= 0) return petCount - 1;
  if (extIdx >= petCount + 1) return 0;
  return extIdx - 1;
}

interface Props {
  pets: Pet[];
  storePool: FocoPet[];
  initialRealIndex?: number;
  onPetPress: (petId: string) => void;
  onActivePetChange?: (petDefId: string) => void;
}

export function CenteredPetCarousel({
  pets,
  storePool,
  initialRealIndex = 0,
  onPetPress,
  onActivePetChange,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slides = useMemo(() => buildLoopSlides(pets), [pets]);
  const styles = useThemedStyles(createCarouselStyles);
  const n = pets.length;

  const [activePetIndex, setActivePetIndex] = useState(() =>
    Math.max(0, Math.min(initialRealIndex, Math.max(n - 1, 0))),
  );

  const jumpWithoutAnimation = (extIndex: number) => {
    scrollRef.current?.scrollTo({ x: extIndex * PET_SNAP, animated: false });
    scrollX.setValue(extIndex * PET_SNAP);
  };

  const petIdsKey = pets.map((p) => p.id).join('|');

  useEffect(() => {
    if (n === 0) return;
    const safeReal = Math.max(0, Math.min(initialRealIndex, n - 1));
    const startExt = n === 1 ? 0 : safeReal + 1;
    setActivePetIndex(safeReal);
    requestAnimationFrame(() => jumpWithoutAnimation(startExt));
  }, [n, petIdsKey, initialRealIndex]);

  const syncIndex = (offsetX: number) => {
    const idx = realIndexFromOffset(offsetX, n);
    setActivePetIndex(idx);
    if (pets[idx]) onActivePetChange?.(pets[idx].id);
  };

  const handleScrollEnd = (offsetX: number) => {
    if (n <= 1) {
      syncIndex(offsetX);
      return;
    }
    const extIdx = Math.round(offsetX / PET_SNAP);
    if (extIdx <= 0) {
      jumpWithoutAnimation(n);
      setActivePetIndex(n - 1);
      return;
    }
    if (extIdx >= n + 1) {
      jumpWithoutAnimation(1);
      setActivePetIndex(0);
      return;
    }
    setActivePetIndex(extIdx - 1);
  };

  if (n === 0) return null;

  return (
    <View style={[styles.clip, { width: SCREEN_W }]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        contentContainerStyle={[
          styles.row,
          { paddingHorizontal: PET_SIDE_PAD },
        ]}
        decelerationRate="fast"
        snapToInterval={PET_SNAP}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          {
            useNativeDriver: true,
            listener: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
              syncIndex(e.nativeEvent.contentOffset.x),
          },
        )}
        onMomentumScrollEnd={(e) =>
          handleScrollEnd(e.nativeEvent.contentOffset.x)
        }
        onScrollEndDrag={(e) => handleScrollEnd(e.nativeEvent.contentOffset.x)}
      >
        {slides.map((slide, slideIdx) => {
          const p =
            storePool.find((r) => r.name.toLowerCase() === slide.def.id) ??
            storePool[0];
          const xpPct = p.xp_next_level > 0 ? p.xp / p.xp_next_level : 0;
          const focused = slide.realIndex === activePetIndex;
          const isLast = slideIdx === slides.length - 1;

          const inputRange = [
            (slide.extIndex - 1) * PET_SNAP,
            slide.extIndex * PET_SNAP,
            (slide.extIndex + 1) * PET_SNAP,
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [SIDE_SCALE, CENTER_SCALE, SIDE_SCALE],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [SIDE_OPACITY, CENTER_OPACITY, SIDE_OPACITY],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={slide.key}
              style={[
                styles.slide,
                {
                  width: PET_ITEM_W,
                  marginRight: isLast ? 0 : PET_GAP,
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.card}
                onPress={() => onPetPress(slide.def.id)}
                activeOpacity={0.88}
              >
                <View style={styles.preview}>
                  <PetRenderer
                    pet={slide.def}
                    size={140}
                    interactive={focused}
                  />
                </View>
                <Text style={styles.name}>{slide.def.name}</Text>
                {focused && (
                  <>
                    <View style={styles.levelPill}>
                      <Text
                        style={[
                          styles.levelPillText,
                          { color: slide.def.accent },
                        ]}
                      >
                        Lv.{p.level}
                      </Text>
                    </View>
                    <View style={styles.xpBarBg}>
                      <View
                        style={[
                          styles.xpBarFill,
                          {
                            width: `${Math.min(xpPct * 100, 100)}%` as any,
                            backgroundColor: slide.def.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.xpText}>
                      {p.xp} / {p.xp_next_level} XP
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

function createCarouselStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    clip: { height: PET_CAROUSEL_H, overflow: 'visible' },
    row: { alignItems: 'flex-end' },
    slide: { alignItems: 'center', justifyContent: 'flex-end' },
    card: {
      width: '100%',
      paddingHorizontal: 8,
      paddingTop: 4,
      paddingBottom: 10,
      alignItems: 'center',
    },
    preview: {
      width: 150,
      height: 150,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
      marginTop: 4,
    },
    name: {
      fontFamily: 'Fraunces_500Medium',
      fontSize: 17,
      fontWeight: '500',
      color: colors.ink,
      letterSpacing: -0.2,
      marginBottom: 5,
    },
    levelPill: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 9999,
      marginBottom: 10,
      backgroundColor: surfaces.emojiCellBg,
    },
    levelPillText: { fontSize: 10, fontWeight: '700' },
    xpBarBg: {
      width: '100%',
      height: 4,
      borderRadius: 9999,
      backgroundColor: surfaces.chartTrack,
      overflow: 'hidden',
      marginBottom: 4,
    },
    xpBarFill: { height: 4, borderRadius: 9999 },
    xpText: { fontSize: 9, color: colors.inkFaint, letterSpacing: 0.2 },
  });
}
