/**
 * FrostCard — heavy-frost glass card.
 * Uses expo-blur BlurView for real backdrop blur (iOS/Android).
 * Spec: blur 40px saturate 160%, bg rgba(255,255,255,0.62), inner sheen.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface FrostCardProps {
  children: React.ReactNode;
  radius?: number;
  padded?: boolean;
  style?: ViewStyle;
}

export function FrostCard({ children, radius = 32, padded = true, style }: FrostCardProps) {
  return (
    <View style={[styles.shadow, { borderRadius: radius }, style]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        {/* Real blur layer */}
        <BlurView
          intensity={60}
          tint="light"
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
        />

        {/* White tint overlay on top of blur */}
        <View style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.48)' },
        ]} />

        {/* Top sheen — upper 55% lighter */}
        <View style={[styles.sheen, {
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
        }]} pointerEvents="none" />

        {/* Border highlight */}
        <View style={[styles.border, { borderRadius: radius }]} pointerEvents="none" />

        {/* Content */}
        <View style={{ padding: padded ? 28 : 0 }}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: 'rgb(60,40,80)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.10,
    shadowRadius: 40,
    elevation: 10,
  },
  clip: {
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '55%',
    backgroundColor: 'rgba(255,255,255,0.32)',
    pointerEvents: 'none',
  },
  border: {
    position: 'absolute',
    inset: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    pointerEvents: 'none',
  },
});
