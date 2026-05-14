// ─────────────────────────────────────────────
// GlassCard — LinearGradient 取代 backdrop-blur
// ─────────────────────────────────────────────
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Shadow } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: readonly [string, string, ...string[]];
}

export function GlassCard({
  children,
  style,
  colors = ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.72)'],
}: GlassCardProps) {
  return (
    <LinearGradient
      colors={colors}
      style={[styles.card, Shadow.md, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    padding: 16,
    overflow: 'hidden',
  },
});
