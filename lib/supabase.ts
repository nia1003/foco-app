// ─────────────────────────────────────────────
// Supabase Client — Auth + DB + Edge Functions
// ─────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: Platform.OS !== 'web',
    detectSessionInUrl: false,
  },
});

const STALE_SESSION_MARKERS = [
  'invalid refresh token',
  'refresh token not found',
  'refresh_token_not_found',
];

function getSupabaseStorageKey(): string | null {
  try {
    const host = new URL(supabaseUrl).hostname;
    const projectRef = host.split('.')[0];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

export function isStaleAuthSessionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String((error as { message?: unknown })?.message ?? '');

  const normalized = message.toLowerCase();
  return STALE_SESSION_MARKERS.some((marker) => normalized.includes(marker));
}

export async function clearLocalSupabaseSession(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});

  const storageKey = getSupabaseStorageKey();
  if (!storageKey) return;

  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(storageKey);
    return;
  }

  await AsyncStorage.removeItem(storageKey).catch(() => {});
}

export async function getCurrentSession(): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    if (isStaleAuthSessionError(error)) {
      await clearLocalSupabaseSession();
    }
    throw error;
  }

  return session;
}
