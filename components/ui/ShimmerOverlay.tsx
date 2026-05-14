// ─────────────────────────────────────────────
// ShimmerOverlay — 內建 Animated（Expo Go 相容）
// ─────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerOverlayProps {
  width?: number;
  style?: ViewStyle;
}

export function ShimmerOverlay({ width = 300, style }: ShimmerOverlayProps) {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1200,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [width, translateX]);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, style]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
