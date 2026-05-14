// ─────────────────────────────────────────────
// OnboardingHeader — Signup 流程頂部（返回 + 進度點）
// ─────────────────────────────────────────────
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

interface OnboardingHeaderProps {
  step: number;   // 目前是第幾步（1-based）
  total?: number; // 總步數
  showBack?: boolean;
}

export function OnboardingHeader({ step, total = 4, showBack = true }: OnboardingHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.dot, i < step ? styles.dotActive : undefined]} />
        ))}
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    marginBottom: 28,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 28,
    fontWeight: '500',
  },
  spacer: { width: 32 },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primary },
});
