// ─────────────────────────────────────────────
// Root Layout — Session 恢復、路由守衛
// ─────────────────────────────────────────────
import '../global.css';
import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { audioService } from '@/services/audioService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SoundProvider } from '@/components/SoundProvider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const darkMode = usePreferencesStore((s) => s.darkMode);
  const hydratePrefs = usePreferencesStore((s) => s.hydrate);

  const splashHiddenRef = useRef(false);

  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
  });

  // 初始化 Audio + 恢復 Token Session
  useEffect(() => {
    audioService.init();
    hydratePrefs();
    restoreSession();
  }, [restoreSession, hydratePrefs]);

  // 路由守衛：isLoading 結束後決定跳去哪
  useEffect(() => {
    if (isLoading) return;

    if (!splashHiddenRef.current) {
      splashHiddenRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }

    const inAuthGroup = segments[0] === '(auth)';
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)/home');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SoundProvider>
          <StatusBar style={darkMode ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }} />
        </SoundProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
