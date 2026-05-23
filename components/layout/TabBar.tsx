/**
 * TabBar — floating liquid glass pill (iOS 26 style).
 * FOCO tabs: Home / Missions / Stats
 * focus / reward / analysis / pet-info 路由時自動隱藏。
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
type TabId = 'home' | 'missions' | 'stats';

interface Tab {
  id: TabId;
  label: string;
  href: string;
  icon: (color: string) => React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/(app)/home',
    icon: (c) => (
      <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        {/* 屋頂三角 */}
        <View style={{
          position: 'absolute', top: 0,
          width: 0, height: 0,
          borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 9,
          borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: c,
        }} />
        {/* 房身 */}
        <View style={{
          position: 'absolute', bottom: 0,
          width: 14, height: 11,
          borderRadius: 2,
          backgroundColor: c,
        }} />
        {/* 門 */}
        <View style={{
          position: 'absolute', bottom: 0,
          width: 5, height: 7,
          borderRadius: 1,
          backgroundColor: 'rgba(255,255,255,0.35)',
        }} />
      </View>
    ),
  },
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
    id: 'stats',
    label: 'Stats',
    href: '/(app)/stats',
    icon: (c) => (
      <View style={{ width: 22, height: 22, alignItems: 'flex-end', justifyContent: 'flex-end', flexDirection: 'row', gap: 2 }}>
        <View style={{ width: 3, height: 8,  backgroundColor: c, borderRadius: 1 }} />
        <View style={{ width: 3, height: 13, backgroundColor: c, borderRadius: 1 }} />
        <View style={{ width: 3, height: 16, backgroundColor: c, borderRadius: 1 }} />
      </View>
    ),
  },
];

// 這些路由不顯示 tab bar
const HIDDEN_ROUTES = ['/focus', '/reward', '/analysis', '/pet-info'];

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, surfaces, isDark } = useAppTheme();

  if (HIDDEN_ROUTES.some((r) => pathname.includes(r))) return null;

  // Home route uses its own EmbeddedTabBar (lives inside the dark section).
  // Showing the global Tab Bar here would float over Page 1.
  const isHome = pathname === '/home' || pathname.endsWith('/home');
  if (isHome) return null;

  const fg = colors.ink;
  const muted = colors.inkSoft;
  const glassColor = surfaces.pillBg;
  const glassBorder = surfaces.pillBorder;
  const activeBg = surfaces.pillActiveBg;
  const activeBorder = surfaces.pillActiveBorder;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: glassColor,
            borderColor: glassBorder,
            shadowColor: surfaces.shadowColor,
          },
        ]}
      >
        {TABS.map((tab) => {
          // home 需要精確比對避免誤判 /home 在其他路由中
          const isActive =
            tab.id === 'home'
              ? pathname === '/home' || pathname.endsWith('/home')
              : pathname.includes(tab.id);
          const color = isActive ? fg : muted;

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
              {tab.icon(isActive ? fg : muted)}
              <Text style={[styles.label, { color, fontWeight: isActive ? '600' : '500' }]}>
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
    top: 2, bottom: 2, left: 8, right: 8,
    borderRadius: 9999,
    borderWidth: 0.5,
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
});
