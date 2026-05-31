import { Fonts } from '@/constants/fonts';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppTheme } from '@/hooks/useAppTheme';

interface WavyTimerProps {
  /** Elapsed progress 0 (start) → 1 (complete) */
  progress: number;
  timeLabel: string;
  size?: number;
  strokeWidth?: number;
  /** Override ring stroke; defaults to theme-aware color */
  strokeColor?: string;
  caption?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const WAVES = 16;
const POINTS = 360;

function buildWavyCircle(
  cx: number,
  cy: number,
  baseRadius: number,
  amplitude: number,
  waves: number,
) {
  const startAngle = -Math.PI / 2;
  const coords: { x: number; y: number }[] = [];

  for (let i = 0; i <= POINTS; i++) {
    const t = i / POINTS;
    const angle = startAngle + t * Math.PI * 2;
    const r = baseRadius + amplitude * Math.sin(waves * angle);
    coords.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    path += ` L ${coords[i].x} ${coords[i].y}`;
  }

  let length = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x;
    const dy = coords[i].y - coords[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }

  return { path, length };
}

export function WavyTimer({
  progress,
  timeLabel,
  size = 300,
  strokeWidth = 9,
  strokeColor,
  caption,
  style,
  children,
}: WavyTimerProps) {
  const { isDark, colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const clamped = Math.min(1, Math.max(0, progress));
  const ringStroke = strokeColor ?? (isDark ? '#f5f2f8' : '#2D2150');

  const { path, length } = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = (size - strokeWidth * 2) / 2 - 6;
    const amplitude = Math.max(5, baseRadius * 0.045);
    return buildWavyCircle(cx, cy, baseRadius, amplitude, WAVES);
  }, [size, strokeWidth]);

  const strokeDashoffset = length * (1 - clamped);

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        <Path
          d={path}
          stroke={ringStroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>

      <View
        style={[styles.center, { width: size * 0.68, height: size * 0.68 }]}
      >
        <View style={styles.innerStack}>
          {children}
          <Text style={[styles.timeText, { color: colors.ink }]}>
            {timeLabel}
          </Text>
          {caption ? (
            <Text style={[styles.caption, { color: colors.inkFaint }]}>
              {caption}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function createStyles(_theme: AppTheme) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerStack: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    timeText: {
      fontFamily: Fonts.display,
      fontSize: 42,
      fontWeight: '600',
      letterSpacing: -1.5,
      lineHeight: 48,
    },
    caption: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 2.5,
    },
  });
}
