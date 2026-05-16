/**
 * RewardScreen — 專注結束後的寵物進度頁
 * 顯示：寵物本體（無框）+ 等級進度條從舊值→新值的動畫 + 升級特效
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import type { SessionResult } from '@/types';

export default function RewardScreen() {
  const router = useRouter();
  const { result: resultStr } = useLocalSearchParams<{ result: string }>();
  const result: SessionResult = resultStr ? JSON.parse(resultStr) : {};
  const { applySessionResult, pets: allPets } = usePetStore();
  const { play } = useSound();

  // ── Resolve pet visual ────────────────────────
  const petRecord = allPets.find((p) => p.id === result.pet_id) ?? allPets[0];
  const petDef =
    (petRecord
      ? PETS.find((p) => p.id === petRecord.name.toLowerCase()) ?? PETS[0]
      : PETS[0]) ?? PETS[0];
  const accent = petDef.accent ?? Colors.pinkText;

  // ── XP fractions ─────────────────────────────
  const oldXpFraction = result.xp_next_level
    ? (result.old_xp ?? 0) / result.xp_next_level
    : 0;
  const newXpFraction = result.xp_next_level
    ? Math.min(result.new_xp / result.xp_next_level, 1)
    : 0;

  // ── Animation refs ────────────────────────────
  const xpBarAnim    = useRef(new Animated.Value(oldXpFraction)).current;
  const levelUpAnim  = useRef(new Animated.Value(0)).current;
  const contentAnim  = useRef(new Animated.Value(0)).current;
  const petScaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (result.pet_id && result.new_xp !== undefined) {
      applySessionResult(result.pet_id, result.new_xp, result.new_level, result.xp_next_level);
    }

    // Pet floats continuously
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Entrance: fade in + pet pops in → bar fills
    Animated.sequence([
      Animated.parallel([
        Animated.timing(contentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(petScaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(xpBarAnim, { toValue: newXpFraction, duration: 1000, useNativeDriver: false }),
    ]).start(() => {
      if (result.level_up) {
        play('transition_up');
        Animated.spring(levelUpAnim, {
          toValue: 1, tension: 40, friction: 5, useNativeDriver: true,
        }).start();
      }
    });
  }, []);

  const xpBarWidth = xpBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      <AppBackground />

      <Animated.View style={[styles.content, { opacity: contentAnim }]}>

        {/* ── Pet (no card) ──────────────────────── */}
        <Animated.View
          style={{
            transform: [
              { translateY: floatAnim },
              { scale: petScaleAnim },
            ],
          }}
        >
          <PetRenderer pet={petDef} size={240} interactive={false} />
        </Animated.View>

        {/* ── Level + progress bar ───────────────── */}
        <View style={styles.progressSection}>
          <View style={styles.levelRow}>
            <Text style={[styles.levelLabel, { color: accent }]}>Lv.{result.new_level}</Text>
            {result.level_up && (
              <Animated.View
                style={[
                  styles.levelUpBadge,
                  {
                    opacity: levelUpAnim,
                    transform: [
                      { scale: levelUpAnim },
                      {
                        translateY: levelUpAnim.interpolate({
                          inputRange: [0, 1], outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.levelUpText}>🎉 Level Up!</Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.xpBarBg}>
            <Animated.View
              style={[styles.xpBarFill, { width: xpBarWidth, backgroundColor: accent }]}
            />
          </View>
        </View>

        {/* ── Buttons ────────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              play('transition_up');
              router.push({ pathname: '/(app)/analysis', params: { result: resultStr } });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>查看報告 →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => { play('transition_down'); router.replace('/(app)/home'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostBtnText}>回首頁</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 0,
  },

  // Progress
  progressSection: {
    width: '100%',
    marginTop: 24,
    gap: 10,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  levelLabel: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },

  levelUpBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(242,206,220,0.50)',
    borderWidth: 1,
    borderColor: 'rgba(181,96,122,0.30)',
  },
  levelUpText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.pinkText,
  },

  xpBarBg: {
    height: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    overflow: 'hidden',
    width: '100%',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 9999,
  },

  // Buttons
  actions: { width: '100%', gap: 10, marginTop: 36 },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  ghostBtn: { paddingVertical: 14, alignItems: 'center' },
  ghostBtnText: { fontSize: 14, color: Colors.inkSoft },
});
