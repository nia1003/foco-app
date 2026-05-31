import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { audioService } from '@/services/audioService';

const KEYS = {
  sound: '@foco/soundEnabled',
  dark: '@foco/darkMode',
  duration: '@foco/focusDurationMin',
  avatarUri: '@foco/avatarUri',
} as const;

interface PreferencesState {
  hydrated: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  focusDurationMin: number;
  avatarUri: string | null;

  hydrate: () => Promise<void>;
  setSoundEnabled: (v: boolean) => Promise<void>;
  setDarkMode: (v: boolean) => Promise<void>;
  setFocusDurationMin: (min: number) => Promise<void>;
  setAvatarUri: (uri: string | null) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  hydrated: false,
  soundEnabled: true,
  darkMode: false,
  focusDurationMin: 25,
  avatarUri: null,

  hydrate: async () => {
    try {
      const pairs = await AsyncStorage.multiGet(Object.values(KEYS));
      const map = Object.fromEntries(pairs) as Record<string, string | null>;

      const soundEnabled = map[KEYS.sound] !== 'false';
      const darkMode = map[KEYS.dark] === 'true';
      const focusDurationMin = Math.min(
        120,
        Math.max(5, Number(map[KEYS.duration]) || 25),
      );
      const avatarUri = map[KEYS.avatarUri] ?? null;

      audioService.setEnabled(soundEnabled);

      set({
        hydrated: true,
        soundEnabled,
        darkMode,
        focusDurationMin,
        avatarUri,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setSoundEnabled: async (v) => {
    audioService.setEnabled(v);
    await AsyncStorage.setItem(KEYS.sound, String(v));
    set({ soundEnabled: v });
  },

  setDarkMode: async (v) => {
    await AsyncStorage.setItem(KEYS.dark, String(v));
    set({ darkMode: v });
  },

  setFocusDurationMin: async (min) => {
    const clamped = Math.min(120, Math.max(5, Math.round(min)));
    await AsyncStorage.setItem(KEYS.duration, String(clamped));
    set({ focusDurationMin: clamped });
  },

  setAvatarUri: async (uri) => {
    if (uri) await AsyncStorage.setItem(KEYS.avatarUri, uri);
    else await AsyncStorage.removeItem(KEYS.avatarUri);
    set({ avatarUri: uri });
  },
}));
