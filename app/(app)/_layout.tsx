// ─────────────────────────────────────────────
// App Group Layout — 主 App 路由群組
// ─────────────────────────────────────────────
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
