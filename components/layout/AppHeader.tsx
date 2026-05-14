// ─────────────────────────────────────────────
// AppHeader — 對應原始設計的 AppHeader
// ─────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontWeight } from '@/constants/theme';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  action?: React.ReactNode;
}

export function AppHeader({ title = '', showBack = false, action }: AppHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.actionSlot}>{action ?? <View style={styles.placeholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: Colors.ink,
    lineHeight: 32,
    fontWeight: '500' as const,
  },
  placeholder: { width: 36, height: 36 },
  title: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: FontSize.md,
    fontWeight: '600' as const,
    color: Colors.ink,
  },
  actionSlot: {
    width: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
