/**
 * Glass — iOS 26 Liquid Glass primitive with real blur.
 * Uses expo-blur BlurView for backdrop blur.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';

type Tone = 'clear' | 'chrome' | 'pink' | 'blue' | 'ink';

interface GlassProps {
  children: React.ReactNode;
  radius?: number;
  tone?: Tone;
  dark?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

function getTintOverlay(tone: Tone, dark: boolean): string {
  const map: Record<Tone, string> = {
    clear: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.38)',
    chrome: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.60)',
    pink: dark ? 'rgba(231,160,204,0.18)' : 'rgba(232,71,151,0.14)',
    blue: dark ? 'rgba(148,194,218,0.18)' : 'rgba(32,63,154,0.10)',
    ink: 'rgba(20,16,28,0.72)',
  };
  return map[tone];
}

function getBlurTint(dark: boolean): 'light' | 'dark' | 'default' {
  return dark ? 'dark' : 'light';
}

export function Glass({ children, radius = 28, tone = 'clear', dark = false, padded = true, style }: GlassProps) {
  const overlay = getTintOverlay(tone, dark);
  const blurTint = getBlurTint(dark);
  const borderColor = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.65)';

  return (
    <View style={[
      styles.shadow,
      dark ? styles.shadowDark : styles.shadowLight,
      { borderRadius: radius },
      style,
    ]}>
      <View style={[styles.clip, { borderRadius: radius }]}>
        {/* Real blur */}
        <BlurView
          intensity={dark ? 40 : 50}
          tint={blurTint}
          style={[StyleSheet.absoluteFillObject]}
        />

        {/* Tone tint */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlay }]} />

        {/* Top sheen */}
        <View style={[styles.sheen, {
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
          backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.32)',
        }]} pointerEvents="none" />

        {/* Border */}
        <View style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: radius, borderWidth: 0.5, borderColor },
        ]} pointerEvents="none" />

        <View style={{ padding: padded ? 20 : 0 }}>
          {children}
        </View>
      </View>
    </View>
  );
}

export function GlassPill({ children, tone = 'chrome', dark = false, style }: Omit<GlassProps, 'radius' | 'padded'>) {
  return (
    <Glass radius={9999} tone={tone} dark={dark} padded={false} style={style}>
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  shadow: { },
  shadowLight: {
    shadowColor: 'rgb(60,40,80)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 4,
  },
  shadowDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  clip: {
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    pointerEvents: 'none',
  },
});
