// ─────────────────────────────────────────────
// Auth Group Layout — Onboarding 流程
// ─────────────────────────────────────────────
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="consent" />
      <Stack.Screen name="done" />
      <Stack.Screen name="pet" />
      <Stack.Screen name="focus-type" />
    </Stack>
  );
}
