/**
 * FrostCard — heavy-frost glass card (theme-aware).
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/hooks/useAppTheme';

interface FrostCardProps {
  children: React.ReactNode;
  radius?: number;
  padded?: boolean;
  style?: ViewStyle;
}

export function FrostCard({ children, radius = 32, padded = true, style }: FrostCardProps) {
  const { surfaces } = useAppTheme();

  return (
    <View
      style={[
        styles.shadow,
        { borderRadius: radius, shadowColor: surfaces.shadowColor },
        style,
      ]}
    >
      <View style={[styles.clip, { borderRadius: radius }]}>
        <BlurView
          intensity={surfaces.blurTint === 'dark' ? 48 : 60}
          tint={surfaces.blurTint}
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
        />

        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: radius, backgroundColor: surfaces.frostOverlay },
          ]}
        />

        <View
          style={[
            styles.sheen,
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              backgroundColor: surfaces.frostSheen,
            },
          ]}
          pointerEvents="none"
        />

        <View
          style={[
            styles.border,
            { borderRadius: radius, borderColor: surfaces.frostBorder },
          ]}
          pointerEvents="none"
        />

        <View style={{ padding: padded ? 28 : 0 }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 10,
  },
  clip: { overflow: 'hidden' },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    pointerEvents: 'none',
  },
  border: {
    position: 'absolute',
    inset: 0,
    borderWidth: 1,
    pointerEvents: 'none',
  },
});
