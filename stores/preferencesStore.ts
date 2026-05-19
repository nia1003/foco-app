import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { audioService } from '@/services/audioService';
import {
  APP_THEME_PRESETS,
  normalizeAppStyleId,
  type AppStyleId,
} from '@/constants/appThemes';

const KEYS = {
  sound: '@foco/soundEnabled',
  dark: '@foco/darkMode',
  duration: '@foco/focusDurationMin',
  appStyle: '@foco/appStyle',
  avatarUri: '@foco/avatarUri',
} as const;

export type { AppStyleId };

export const APP_STYLE_OPTIONS = (
  Object.keys(APP_THEME_PRESETS) as AppStyleId[]
).map((id) => ({
  id,
  label: APP_THEME_PRESETS[id].label,
  swatch: APP_THEME_PRESETS[id].swatch,
}));

interface PreferencesState {
  hydrated: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  focusDurationMin: number;
  appStyleId: AppStyleId;
  avatarUri: string | null;

  hydrate: () => Promise<void>;
  setSoundEnabled: (v: boolean) => Promise<void>;
  setDarkMode: (v: boolean) => Promise<void>;
  setFocusDurationMin: (min: number) => Promise<void>;
  setAppStyleId: (id: AppStyleId) => Promise<void>;
  setAvatarUri: (uri: string | null) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  hydrated: false,
  soundEnabled: true,
  darkMode: false,
  focusDurationMin: 25,
  appStyleId: 'default',
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
      const appStyleId = normalizeAppStyleId(map[KEYS.appStyle]);
      const avatarUri = map[KEYS.avatarUri] ?? null;

      audioService.setEnabled(soundEnabled);
      set({
        hydrated: true,
        soundEnabled,
        darkMode,
        focusDurationMin,
        appStyleId,
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

  setAppStyleId: async (id) => {
    await AsyncStorage.setItem(KEYS.appStyle, id);
    set({ appStyleId: id });
  },

  setAvatarUri: async (uri) => {
    if (uri) await AsyncStorage.setItem(KEYS.avatarUri, uri);
    else await AsyncStorage.removeItem(KEYS.avatarUri);
    set({ avatarUri: uri });
  },
}));
