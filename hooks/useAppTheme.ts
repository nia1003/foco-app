import { useMemo } from 'react';

import { Colors } from '@/constants/theme';

import { DarkColors } from '@/constants/darkTheme';

import {
  DEFAULT_DARK_BACKGROUND,
  DEFAULT_LIGHT_BACKGROUND,
  getAppThemePreset,
  type AppBackgroundStyle,
  type AppStyleId,
} from '@/constants/appThemes';

import {
  darkSurfaces,
  lightSurfaces,
  type ThemeSurfaces,
} from '@/constants/themeSurfaces';

import { usePreferencesStore } from '@/stores/preferencesStore';

export type ThemeColors = typeof Colors;

export interface AppTheme {
  isDark: boolean;

  appStyleId: AppStyleId;

  colors: ThemeColors;

  surfaces: ThemeSurfaces;

  screenBg: string;

  background: AppBackgroundStyle;
}

export function useAppTheme(): AppTheme {
  const darkMode = usePreferencesStore((s) => s.darkMode);

  const appStyleId = usePreferencesStore((s) => s.appStyleId);

  return useMemo(() => {
    const isDark = darkMode;

    const baseColors = (
      isDark ? { ...Colors, ...DarkColors } : { ...Colors }
    ) as ThemeColors;

    let colors = baseColors;

    let surfaces: ThemeSurfaces = isDark
      ? { ...darkSurfaces }
      : { ...lightSurfaces };

    let screenBg = isDark ? DarkColors.screenBg : '#f6f4f4';

    let background: AppBackgroundStyle = isDark
      ? DEFAULT_DARK_BACKGROUND
      : DEFAULT_LIGHT_BACKGROUND;

    if (appStyleId !== 'default') {
      const preset = getAppThemePreset(appStyleId);

      const colorPatch = isDark ? preset.darkColors : preset.lightColors;

      if (colorPatch) colors = { ...colors, ...colorPatch } as ThemeColors;

      const surfacePatch = isDark ? preset.darkSurfaces : preset.lightSurfaces;

      if (surfacePatch) surfaces = { ...surfaces, ...surfacePatch };

      screenBg = isDark ? preset.darkScreenBg : preset.lightScreenBg;

      background = isDark ? preset.darkBackground : preset.lightBackground;
    }

    surfaces = {
      ...surfaces,
      modalBackdrop: isDark ? 'rgba(0,0,0,0.78)' : 'rgba(0,0,0,0.62)',
      modalSheetBg: screenBg,
      modalInsetBg: isDark ? '#262034' : '#f0eeec',
    };

    return {
      isDark,
      appStyleId,
      colors,
      surfaces,
      screenBg,
      background,
    };
  }, [darkMode, appStyleId]);
}
