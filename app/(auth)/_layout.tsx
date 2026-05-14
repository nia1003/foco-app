// ─────────────────────────────────────────────
// Auth Group Layout — Onboarding 流程
// ─────────────────────────────────────────────
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    />
  );
}
