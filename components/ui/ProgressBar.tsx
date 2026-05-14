// ─────────────────────────────────────────────
// ProgressBar — 數值進度條
// ─────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

interface ProgressBarProps {
  value: number;       // 0–100
  max?: number;
  label?: string;
  color?: string;
  showValue?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  color = Colors.primary,
  showValue = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <View style={styles.container}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showValue && (
            <Text style={styles.value}>
              {value}/{max}
            </Text>
          )}
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary },
  value: { fontSize: FontSize.xs, color: Colors.textSecondary },
  track: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Radius.full },
});
