// ─────────────────────────────────────────────
// App Group Layout — Tab Navigator（FOCO）
// 使用自訂 TabBar 元件，focus/reward/analysis 隱藏 tab bar
// ─────────────────────────────────────────────
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/layout/TabBar';

export default function AppLayout() {
  return (
    <Tabs
      initialRouteName="home"
      tabBar={() => <TabBar />}
      screenOptions={{ headerShown: false }}
    >
      {/* Tab 頁面 */}
      <Tabs.Screen name="home"     options={{ title: 'Home' }} />
      <Tabs.Screen name="missions" options={{ title: 'Missions' }} />
      <Tabs.Screen name="stats"    options={{ title: 'Stats' }} />

      {/* 不顯示在 tab bar 的頁面 */}
      <Tabs.Screen name="focus"          options={{ href: null }} />
      <Tabs.Screen name="reward"         options={{ href: null }} />
      <Tabs.Screen name="analysis"       options={{ href: null }} />
      <Tabs.Screen name="pet-info"       options={{ href: null }} />
      <Tabs.Screen name="pet-collection" options={{ href: null }} />
      <Tabs.Screen name="settings"       options={{ href: null }} />
      <Tabs.Screen name="day-log"        options={{ href: null }} />
    </Tabs>
  );
}
