// ─────────────────────────────────────────────
// PomodoroDotPicker — 選擇 Pomodoro 數量（點點選擇器）
// ─────────────────────────────────────────────
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

interface PomodoroDotPickerProps {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}

export function PomodoroDotPicker({
  value,
  onChange,
  max = 8,
}: PomodoroDotPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{value} pomodoro{value !== 1 ? 's' : ''}</Text>
      <View style={styles.dots}>
        {Array.from({ length: max }).map((_, i) => {
          const n = i + 1;
          const active = n <= value;
          return (
            <TouchableOpacity
              key={n}
              style={[styles.dot, active && styles.dotActive]}
              onPress={() => onChange(n)}
              activeOpacity={0.7}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.sm },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
