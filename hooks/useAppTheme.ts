import { useMemo } from 'react';

import { Colors } from '@/constants/theme';
import { DarkColors } from '@/constants/darkTheme';
import {
  DEFAULT_DARK_BACKGROUND,
  DEFAULT_LIGHT_BACKGROUND,
  type AppBackgroundStyle,
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
  colors: ThemeColors;
  surfaces: ThemeSurfaces;
  screenBg: string;
  background: AppBackgroundStyle;
}

export function useAppTheme(): AppTheme {
  const darkMode = usePreferencesStore((s) => s.darkMode);

  return useMemo(() => {
    const isDark = darkMode;
    const colors = (
      isDark ? { ...Colors, ...DarkColors } : { ...Colors }
    ) as ThemeColors;
    const surfaces: ThemeSurfaces = isDark
      ? { ...darkSurfaces }
      : { ...lightSurfaces };
    const screenBg = isDark ? DarkColors.screenBg : '#f6f4f4';
    const background = isDark
      ? DEFAULT_DARK_BACKGROUND
      : DEFAULT_LIGHT_BACKGROUND;

    return {
      isDark,
      colors,
      surfaces: {
        ...surfaces,
        modalBackdrop: isDark ? 'rgba(0,0,0,0.78)' : 'rgba(0,0,0,0.62)',
        modalSheetBg: screenBg,
        modalInsetBg: isDark ? '#262034' : '#f0eeec',
      },
      screenBg,
      background,
    };
  }, [darkMode]);
}
