// ─────────────────────────────────────────────
// Card — 通用卡片容器
// ─────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padded?: boolean;
}

export function Card({ children, style, elevated = true, padded = true }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && Shadow.md,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glassChrome,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  padded: { padding: Spacing.md },
});
