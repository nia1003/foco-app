// ─────────────────────────────────────────────
// PageBackground — 漸層背景取代 CSS gradient
// ─────────────────────────────────────────────
import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PageBackgroundProps {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export function PageBackground({
  children,
  colors = ['#F9FAFB', '#FFFFFF'],
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
}: PageBackgroundProps) {
  return (
    <LinearGradient colors={colors} start={start} end={end} style={styles.bg}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
});
