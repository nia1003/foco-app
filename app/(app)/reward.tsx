/**
 * RewardScreen — Session 結束後的寵物進度頁面
 * 顯示：寵物等級進度條從舊值→新值的動畫、升級提示 → 查看報告 or 回首頁
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
import { FrostCard } from '@/components/ui/FrostCard';
import { Colors } from '@/constants/theme';
import { usePetStore } from '@/stores/petStore';
import type { SessionResult } from '@/types';

export default function RewardScreen() {
  const router = useRouter();
  const { result: resultStr } = useLocalSearchParams<{ result: string }>();
  const result: SessionResult = resultStr ? JSON.parse(resultStr) : {};
  const { applySessionResult } = usePetStore();
  const { play } = useSound();

  const oldXpFraction = result.xp_next_level
    ? (result.old_xp ?? 0) / result.xp_next_level
    : 0;
  const newXpFraction = result.xp_next_level
    ? result.new_xp / result.xp_next_level
    : 0;

  // ── 動畫 refs ────────────────────────────────
  const xpBarAnim = useRef(new Animated.Value(oldXpFraction)).current;
  const levelUpAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. 更新 pet store
    if (result.pet_id && result.new_xp !== undefined) {
      applySessionResult(result.pet_id, result.new_xp, result.new_level, result.xp_next_level);
    }

    // 2. 進場動畫序列
    Animated.sequence([
      Animated.timing(cardFadeAnim, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
      Animated.timing(xpBarAnim, {
        toValue: newXpFraction, duration: 900, useNativeDriver: false,
      }),
    ]).start(() => {
      if (result.level_up) {
        Animated.spring(levelUpAnim, {
          toValue: 1, tension: 50, friction: 5, useNativeDriver: true,
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

      <Animated.View style={[styles.content, { opacity: cardFadeAnim }]}>
        {/* 升級提示 */}
        {result.level_up && (
          <Animated.View
            style={[styles.levelUpBadge, { opacity: levelUpAnim, transform: [{ scale: levelUpAnim }] }]}
          >
            <Text style={styles.levelUpText}>🎉 Level Up!</Text>
          </Animated.View>
        )}

        {/* 寵物進度卡 */}
        <FrostCard radius={24}>
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Lv.{result.new_level}</Text>
          </View>
          <View style={styles.xpBarBg}>
            <Animated.View style={[styles.xpBarFill, { width: xpBarWidth }]} />
          </View>
        </FrostCard>

        {/* 按鈕 */}
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
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  levelUpBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(242,206,220,0.40)',
    borderWidth: 1,
    borderColor: 'rgba(181,96,122,0.25)',
  },
  levelUpText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.pinkText,
  },
  levelRow: {
    marginBottom: 10,
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkSoft,
  },
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
  actions: { width: '100%', gap: 10, marginTop: 8 },
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
