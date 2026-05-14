/**
 * AppBackground — the unified app background.
 * Soft white base with a single centered pink radial glow.
 * Matches the reference image exactly using SVG radial gradient.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

export function AppBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient
            id="bg"
            cx="50%"
            cy="45%"
            rx="52%"
            ry="52%"
            gradientUnits="objectBoundingBox"
          >
            {/* Centre — warm pink */}
            <Stop offset="0%"  stopColor="#f0a8be" stopOpacity="0.55" />
            {/* Mid — pale pink */}
            <Stop offset="45%" stopColor="#f5c8d8" stopOpacity="0.30" />
            {/* Edge — near white */}
            <Stop offset="80%" stopColor="#faf0f3" stopOpacity="0.10" />
            {/* Full fade */}
            <Stop offset="100%" stopColor="#f5f4f4" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Base */}
        <Rect x="0" y="0" width={W} height={H} fill="#f6f4f4" />

        {/* Pink radial glow */}
        <Rect x="0" y="0" width={W} height={H} fill="url(#bg)" />
      </Svg>
    </View>
  );
}
