/**
 * FocoWallpaper — warm beige base with soft glowing blobs (feGaussianBlur).
 * Pink/blue/hot-pink blobs that make glass cards actually feel glassy.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Filter, FeGaussianBlur } from 'react-native-svg';
import { Colors } from '@/constants/theme';

const { width: W, height: H } = Dimensions.get('window');

interface FocoWallpaperProps {
  dark?: boolean;
}

export function FocoWallpaper({ dark = false }: FocoWallpaperProps) {
  if (dark) {
    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#050208' }]} />
        <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <Filter id="bd1" x="-60%" y="-60%" width="220%" height="220%">
              <FeGaussianBlur stdDeviation="35" />
            </Filter>
            <Filter id="bd2" x="-60%" y="-60%" width="220%" height="220%">
              <FeGaussianBlur stdDeviation="30" />
            </Filter>
          </Defs>
          <Circle cx={-40} cy={-30} r={180} fill="rgba(42,26,53,0.9)" filter="url(#bd1)" />
          <Circle cx={W + 40} cy={H + 20} r={160} fill="rgba(16,32,70,0.8)" filter="url(#bd2)" />
        </Svg>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Warm beige base */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.beige }]} />

      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
        <Defs>
          {/* Higher stdDeviation = softer / more diffused */}
          <Filter id="f1" x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur stdDeviation="50" />
          </Filter>
          <Filter id="f2" x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur stdDeviation="55" />
          </Filter>
          <Filter id="f3" x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur stdDeviation="60" />
          </Filter>
          <Filter id="f4" x="-60%" y="-60%" width="220%" height="220%">
            <FeGaussianBlur stdDeviation="45" />
          </Filter>
        </Defs>

        {/* Pink blob — top-left */}
        <Circle
          cx={-40}
          cy={-60}
          r={220}
          fill="rgba(231,160,204,0.90)"
          filter="url(#f1)"
        />

        {/* Blue blob — mid-right */}
        <Circle
          cx={W + 60}
          cy={H * 0.42}
          r={200}
          fill="rgba(148,194,218,0.95)"
          filter="url(#f2)"
        />

        {/* Hot-pink blob — bottom-left */}
        <Circle
          cx={-20}
          cy={H + 30}
          r={180}
          fill="rgba(242,206,220,0.60)"
          filter="url(#f3)"
        />

        {/* Deep-blue blob — bottom-right area */}
        <Circle
          cx={W - 40}
          cy={H - 160}
          r={130}
          fill="rgba(32,63,154,0.20)"
          filter="url(#f4)"
        />
      </Svg>
    </View>
  );
}
