/**
 * TabBar — floating liquid glass pill (iOS 26 style).
 * Positioned absolutely at bottom: 22, left/right: 14.
 * Active tab shows a pink-tinted highlight pill.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

type TabId = 'missions' | 'focus' | 'stats' | 'sanctuary';

interface Tab {
  id: TabId;
  label: string;
  href: string;
  icon: (color: string) => React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'missions',
    label: 'Tasks',
    href: '/(app)/missions',
    icon: (c) => (
      <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 14, height: 16, borderRadius: 3, borderWidth: 1.6, borderColor: c, position: 'absolute' }} />
        <View style={{
          position: 'absolute', top: -2, width: 6, height: 3,
          borderRadius: 1, backgroundColor: c,
        }} />
        <View style={{ flexDirection: 'column', gap: 4, marginTop: 2 }}>
          <View style={{ width: 7, height: 0, borderTopWidth: 1.6, borderColor: c, borderRadius: 1 }} />
          <View style={{ width: 7, height: 0, borderTopWidth: 1.6, borderColor: c, borderRadius: 1 }} />
        </View>
      </View>
    ),
  },
  {
    id: 'focus',
    label: 'Focus',
    href: '/(app)/focus',
    icon: (c) => (
      <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 15, height: 15, borderRadius: 7.5, borderWidth: 1.6, borderColor: c }} />
        <View style={{ position: 'absolute', width: 4.4, height: 4.4, borderRadius: 2.2, backgroundColor: c }} />
      </View>
    ),
  },
  {
    id: 'stats',
    label: 'Stats',
    href: '/(app)/stats',
    icon: (c) => (
      <View style={{ width: 22, height: 22, alignItems: 'flex-end', justifyContent: 'flex-end', flexDirection: 'row', gap: 2 }}>
        <View style={{ width: 3, height: 8, backgroundColor: c, borderRadius: 1 }} />
        <View style={{ width: 3, height: 13, backgroundColor: c, borderRadius: 1 }} />
        <View style={{ width: 3, height: 16, backgroundColor: c, borderRadius: 1 }} />
      </View>
    ),
  },
  {
    id: 'sanctuary',
    label: 'My Space',
    href: '/(app)/sanctuary',
    icon: (c) => (
      <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, borderWidth: 1.6, borderColor: c, marginBottom: 4 }} />
        <View style={{ width: 15, height: 0, borderTopWidth: 1.6, borderColor: c, borderRadius: 1 }} />
      </View>
    ),
  },
];

interface TabBarProps {
  dark?: boolean;
}

export function TabBar({ dark = false }: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const fg = dark ? '#fff' : Colors.ink;
  const muted = dark ? 'rgba(255,255,255,0.55)' : Colors.inkSoft;
  const glassColor = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.78)';
  const glassBorder = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.60)';

  return (
    <View style={styles.wrapper}>
      <View style={[styles.pill, { backgroundColor: glassColor, borderColor: glassBorder }]}>
        {TABS.map((tab) => {
          const isActive = pathname.includes(tab.id);
          const color = isActive ? fg : muted;
          const activeBg = dark ? 'rgba(255,255,255,0.16)' : 'rgba(232,71,151,0.18)';
          const activeBorder = dark ? 'rgba(255,255,255,0.18)' : 'rgba(232,71,151,0.28)';

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => router.push(tab.href as any)}
              activeOpacity={0.7}
            >
              {isActive && (
                <View style={[styles.activeHighlight, {
                  backgroundColor: activeBg,
                  borderColor: activeBorder,
                }]} />
              )}
              {tab.icon(color)}
              <Text style={[styles.label, {
                color,
                fontWeight: isActive ? '600' : '500',
              }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 22,
    left: 14,
    right: 14,
    zIndex: 30,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 9999,
    borderWidth: 0.5,
    padding: 8,
    shadowColor: 'rgba(60,40,80,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    position: 'relative',
  },
  activeHighlight: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 8,
    right: 8,
    borderRadius: 9999,
    borderWidth: 0.5,
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
});
