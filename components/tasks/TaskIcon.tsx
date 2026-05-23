import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { findTaskSvgIcon } from '@/constants/taskIcons';
import type { TaskIconValue } from '@/lib/taskIcon';

interface Props {
  icon: TaskIconValue;
  size?: number;
}

export function TaskIcon({ icon, size = 20 }: Props) {
  const { isDark, appStyleId, colors } = useAppTheme();

  if (icon.type === 'emoji') {
    return <Text style={[styles.emoji, { fontSize: size }]}>{icon.value}</Text>;
  }

  const def = findTaskSvgIcon(icon.value);
  if (!def) {
    return <Text style={[styles.emoji, { fontSize: size }]}>📌</Text>;
  }

  const stroke =
    appStyleId === 'monochrome' ? (isDark ? '#ffffff' : '#000000') : colors.ink;

  const { Icon } = def;
  return (
    <View style={[styles.svgWrap, { width: size + 4, height: size + 4 }]}>
      <Icon size={size} color={stroke} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: { textAlign: 'center' },
  svgWrap: { alignItems: 'center', justifyContent: 'center' },
});
