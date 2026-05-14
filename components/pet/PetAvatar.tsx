// ─────────────────────────────────────────────
// PetAvatar — 內建 Animated 浮動（Expo Go 相容）
// ─────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';

const PET_EMOJI: Record<string, string> = {
  sprout:  '🌱',
  cat:     '🐱',
  bunny:   '🐰',
  hamster: '🐹',
  fox:     '🦊',
  chick:   '🐣',
  bear:    '🐻',
  panda:   '🐼',
};

interface PetAvatarProps {
  petKind?: string;
  size?: number;
  animated?: boolean;
}

export function PetAvatar({
  petKind = 'sprout',
  size = 200,
  animated: enableAnim = true,
}: PetAvatarProps) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enableAnim) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -10, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0,   duration: 1800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [enableAnim, float]);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size },
        enableAnim && { transform: [{ translateY: float }] },
      ]}
    >
      <Text style={{ fontSize: size * 0.55, textAlign: 'center' }}>
        {PET_EMOJI[petKind] ?? '🌱'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
