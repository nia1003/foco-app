/**
 * SoftWallpaper — pale cream bg with softly blurred color blobs.
 * Uses react-native-svg feGaussianBlur — identical to CSS `filter: blur()`.
 * Each blob is a circle rendered through a gaussian blur filter in SVG.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Filter, FeGaussianBlur, FeComposite } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

export function SoftWallpaper() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Cream base */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#faf5ef' }]} />

      {/* SVG layer — all blobs share one SVG for performance */}
      <Svg
        width={W}
        height={H}
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          {/* Blur filter — stdDeviation controls softness (CSS blur(20px) ≈ stdDeviation 20) */}
          <Filter id="blur1" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="30" />
          </Filter>
          <Filter id="blur2" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="28" />
          </Filter>
          <Filter id="blur3" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="25" />
          </Filter>
          <Filter id="blur4" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="20" />
          </Filter>
        </Defs>

        {/* Blob 1 — pink, top-right */}
        <Circle
          cx={W + 30}
          cy={-80}
          r={230}
          fill="rgba(246,207,220,0.85)"
          filter="url(#blur1)"
        />

        {/* Blob 2 — lavender, top-left */}
        <Circle
          cx={-70}
          cy={160}
          r={210}
          fill="rgba(232,213,236,0.78)"
          filter="url(#blur2)"
        />

        {/* Blob 3 — blue, bottom-right */}
        <Circle
          cx={W + 20}
          cy={H + 60}
          r={190}
          fill="rgba(214,227,240,0.82)"
          filter="url(#blur3)"
        />

        {/* Blob 4 — peach, lower-left */}
        <Circle
          cx={100}
          cy={H - 220}
          r={140}
          fill="rgba(249,216,199,0.65)"
          filter="url(#blur4)"
        />
      </Svg>
    </View>
  );
}
