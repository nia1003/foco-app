/**
 * PetInfoScreen — 上拉式底部卡片
 * - 全螢幕顯示大寵物（無圓形框）
 * - 底部卡片：往上拉顯示 XP、個性、成長路線
 */
import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import { mockPets } from '@/data/mockData';

const { height: SCREEN_H } = Dimensions.get('window');

// Sheet geometry
const PEEK_H   = 200;              // visible when collapsed: handle + name + level + XP bar top edge
const SHEET_H  = SCREEN_H * 0.72; // height when fully expanded
const MAX_DRAG = SHEET_H - PEEK_H; // translateY range

// Level metadata
const LEVEL_INFO: Record<number, { scale: number; label: string; desc: string }> = {
  1: { scale: 0.7,  label: '新生',   desc: '剛開始旅程，充滿好奇心！' },
  2: { scale: 0.85, label: '成長中', desc: '開始有自己的節奏，越來越有活力！' },
  3: { scale: 1.0,  label: '茁壯',   desc: '已經掌握專注的訣竅，穩健前進！' },
  4: { scale: 1.1,  label: '強壯',   desc: '令人印象深刻的專注力，繼續保持！' },
  5: { scale: 1.2,  label: '傳說',   desc: '已達到最高等級，真正的專注大師！' },
};

export default function PetInfoScreen() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { pets, activePet } = usePetStore();
  const insets = useSafeAreaInsets();

  // When the store is empty (backend not yet loaded), fall back to mockPets as the search pool
  const searchPool = pets.length > 0 ? pets : mockPets;

  // petDef (visual definition): petId param is the PETS constant id ('xingwang'/'lily')
  // — use it directly first, so collection→pet-info always shows the right 3D model + name
  const petDef =
    (petId ? PETS.find((p) => p.id === petId) : null) ??
    PETS.find((p) => p.id === (activePet?.name ?? '').toLowerCase()) ??
    PETS.find((p) => p.id === 'xingwang') ??
    PETS[0];

  // FocoPet (XP / level data): find by UUID or by name matching the petDef
  const pet =
    (petId ? searchPool.find((p) => p.id === petId || p.name.toLowerCase() === petId) : null) ??
    activePet ??
    mockPets[0];

  const level = Math.min(Math.max(pet.level, 1), 5) as 1 | 2 | 3 | 4 | 5;
  const info = LEVEL_INFO[level];
  const xpProgress = pet.xp_next_level > 0 ? pet.xp / pet.xp_next_level : 1;

  // ── Bottom sheet animation ───────────────────
  const sheetY = useRef(new Animated.Value(MAX_DRAG)).current;
  const lastY  = useRef(MAX_DRAG);
  const isOpen = useRef(false);

  const springTo = (target: number) => {
    Animated.spring(sheetY, {
      toValue: target,
      useNativeDriver: true,
      tension: 72,
      friction: 12,
    }).start(() => {
      lastY.current = target;
      isOpen.current = target === 0;
    });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderGrant: () => {
      lastY.current = (sheetY as any)._value;
    },
    onPanResponderMove: (_, g) => {
      const next = Math.max(0, Math.min(MAX_DRAG, lastY.current + g.dy));
      sheetY.setValue(next);
    },
    onPanResponderRelease: (_, g) => {
      const cur = (sheetY as any)._value;
      const shouldOpen = g.vy < -0.3 || cur < MAX_DRAG * 0.45;
      springTo(shouldOpen ? 0 : MAX_DRAG);
    },
  });

  return (
    <View style={styles.root}>
      <AppBackground />

      {/* FocoBar floats above everything */}
      <View style={styles.barWrap}>
        <FocoBar back />
      </View>

      {/* Full-screen pet — no pointerEvents block so WebView can receive touch for 3D spin */}
      <View style={[styles.petBg, { top: 56 + insets.top }]}>
        <PetRenderer pet={petDef} size={380} />
      </View>

      {/* Collection shortcut */}
      <View style={styles.collectionBtn} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => router.push('/(app)/pet-collection' as any)}
          style={styles.collectionPill}
          activeOpacity={0.75}
        >
          <Text style={styles.collectionPillText}>見全部寵物 →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom Sheet ───────────────────────── */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Always-visible: name + level */}
        <View style={styles.peekSection}>
          <Text style={styles.petName}>{petDef.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Lv.{level} · {info.label}</Text>
          </View>
        </View>

        {/* Scrollable details */}
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* XP */}
          <FrostCard radius={24} padded={false}>
            <View style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Experience</Text>
                <Text style={styles.xpNumbers}>
                  {pet.xp}{' '}
                  <Text style={styles.xpMax}>/ {pet.xp_next_level} XP</Text>
                </Text>
              </View>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` as any }]} />
              </View>
              {level < 5 ? (
                <Text style={styles.xpHint}>再 {pet.xp_next_level - pet.xp} XP 升到 Lv.{level + 1}</Text>
              ) : (
                <Text style={styles.xpHint}>已達最高等級 🏆</Text>
              )}
            </View>
          </FrostCard>

          {/* Trait */}
          <View style={styles.section}>
            <FrostCard radius={24}>
              <Text style={styles.traitTitle}>個性</Text>
              <Text style={styles.traitValue}>{petDef.trait}</Text>
              <Text style={styles.traitDesc}>{info.desc}</Text>
            </FrostCard>
          </View>

          {/* Growth roadmap */}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },

  // FocoBar floats above
  barWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 20,
  },

  // Pet fills upper area (top is set dynamically via inline style)
  petBg: {
    position: 'absolute',
    top: 56,   // overridden inline with 56 + insets.top
    left: 0,
    right: 0,
    bottom: PEEK_H,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Collection shortcut pill
  collectionBtn: {
    position: 'absolute',
    bottom: PEEK_H + 16,
    right: 20,
    zIndex: 10,
  },
  collectionPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 0.5,
    borderColor: 'rgba(20,16,28,0.08)',
  },
  collectionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.inkSoft,
  },

  // ── Sheet ───────────────────────────────────
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: Colors.softBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#14101c',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 14,
  },
  handleArea: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(20,16,28,0.14)',
  },

  // Peek section (always visible)
  peekSection: {
    alignItems: 'center',
    paddingBottom: 14,
  },
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
    backgroundColor: 'rgba(242,206,220,0.40)',
    borderWidth: 1,
    borderColor: 'rgba(181,96,122,0.20)',
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b5607a',
    letterSpacing: 0.3,
  },

  // Scrollable detail content
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingHorizontal: 18, paddingBottom: 40 },
  section: { marginTop: 12 },

  // XP card
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
    backgroundColor: '#F2CEDC',
  },
  xpHint: { fontSize: 11, color: Colors.inkFaint, marginTop: 8, textAlign: 'right' },

  // Trait
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
  traitDesc: { fontSize: 13, color: Colors.inkSoft, marginTop: 6, lineHeight: 19 },

  // Roadmap
  roadmapCard: { padding: 20 },
  roadmapTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  roadmapRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  roadmapDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(20,16,28,0.12)',
  },
  roadmapDotActive: { backgroundColor: '#F2CEDC' },
  roadmapLv: { fontSize: 12, color: Colors.inkFaint, width: 36 },
  roadmapLvActive: { color: Colors.ink, fontWeight: '700' },
  roadmapLabel: { flex: 1, fontSize: 13, color: Colors.inkFaint },
  roadmapLabelActive: { color: Colors.ink },
  currentBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(242,206,220,0.50)',
  },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: '#b5607a' },
});
