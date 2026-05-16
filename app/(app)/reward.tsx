/**
 * RewardScreen — Session 結束後的 XP 獎勵頁面
 * 顯示：+XP 動畫、XP bar、升級動畫 → 查看報告 or 回首頁
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

  // ── 動畫 refs ────────────────────────────────
  const xpScaleAnim = useRef(new Animated.Value(0)).current;
  const xpBarAnim = useRef(new Animated.Value(0)).current;
  const levelUpAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;

  const xpFraction = result.xp_next_level
    ? result.new_xp / result.xp_next_level
    : 0;

  useEffect(() => {
    // 1. 更新 pet store
    if (result.new_xp !== undefined) {
      applySessionResult(result.new_xp, result.new_level, result.xp_next_level);
    }

    // 2. 進場動畫序列
    Animated.sequence([
      // Card fade in
      Animated.timing(cardFadeAnim, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
      // +XP 數字彈出
      Animated.spring(xpScaleAnim, {
        toValue: 1, tension: 60, friction: 6, useNativeDriver: true,
      }),
      // XP bar 填充
      Animated.timing(xpBarAnim, {
        toValue: xpFraction, duration: 800, useNativeDriver: false,
      }),
    ]).start(() => {
      // 升級動畫（如果有升級）
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
        {/* +XP 大字 */}
        <Animated.Text
          style={[
            styles.xpBadge,
            { transform: [{ scale: xpScaleAnim }] },
          ]}
        >
          +{result.xp_gained ?? 0} XP
        </Animated.Text>

        {/* 升級提示 */}
        {result.level_up && (
          <Animated.View
            style={[styles.levelUpBadge, { opacity: levelUpAnim, transform: [{ scale: levelUpAnim }] }]}
          >
            <Text style={styles.levelUpText}>🎉 Level Up! Lv.{result.new_level}</Text>
          </Animated.View>
        )}

        {/* XP 進度卡 */}
        <FrostCard radius={24}>
          <Text style={styles.progressLabel}>
            XP {result.new_xp} / {result.xp_next_level}
          </Text>
          <View style={styles.xpBarBg}>
            <Animated.View style={[styles.xpBarFill, { width: xpBarWidth }]} />
          </View>
          <Text style={styles.levelText}>Lv.{result.new_level}</Text>
        </FrostCard>

        {/* 按鈕 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              router.push({ pathname: '/(app)/analysis', params: { result: resultStr } })
            }
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>查看報告 →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.replace('/(app)/home')}
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
  root: { flex: 1, backgroundColor: Colors.softBg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  xpBadge: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 64,
    fontWeight: '500',
    color: Colors.pinkHot,
    letterSpacing: -1,
  },
  levelUpBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(232,71,151,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,71,151,0.3)',
  },
  levelUpText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.pinkHot,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkSoft,
    marginBottom: 10,
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
  levelText: {
    fontSize: 12,
    color: Colors.inkFaint,
    marginTop: 8,
    textAlign: 'right',
    letterSpacing: 0.5,
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
