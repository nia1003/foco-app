import type { ThemeSurfaces } from '@/constants/themeSurfaces';
import { Colors } from '@/constants/theme';

type ColorOverrides = Partial<Record<keyof typeof Colors, string>>;

export type AppStyleId = 'default' | 'monochrome' | 'beige' | 'cottonCandy';

export interface AppBackgroundStyle {
  baseFill: string;
  glowCenter: string;
  glowMid: string;
  glowOuter: string;
  glowEdge: string;
}

export interface AppThemePreset {
  id: AppStyleId;
  label: string;
  swatch: string;
  lightColors?: ColorOverrides;
  darkColors?: ColorOverrides;
  lightSurfaces?: Partial<ThemeSurfaces>;
  darkSurfaces?: Partial<ThemeSurfaces>;
  lightScreenBg: string;
  darkScreenBg: string;
  lightBackground: AppBackgroundStyle;
  darkBackground: AppBackgroundStyle;
}

/** Default light background — must match current AppBackground exactly */
export const DEFAULT_LIGHT_BACKGROUND: AppBackgroundStyle = {
  baseFill: '#f6f4f4',
  glowCenter: '#f0a8be',
  glowMid: '#f5c8d8',
  glowOuter: '#faf0f3',
  glowEdge: '#f5f4f4',
};

export const DEFAULT_DARK_BACKGROUND: AppBackgroundStyle = {
  baseFill: '#121018',
  glowCenter: '#5a3d52',
  glowMid: '#2a2234',
  glowOuter: '#121018',
  glowEdge: '#121018',
};

export const APP_THEME_PRESETS: Record<AppStyleId, AppThemePreset> = {
  default: {
    id: 'default',
    label: 'Default',
    swatch: '#F2CEDC',
    lightScreenBg: '#f6f4f4',
    darkScreenBg: '#121018',
    lightBackground: DEFAULT_LIGHT_BACKGROUND,
    darkBackground: DEFAULT_DARK_BACKGROUND,
  },
  monochrome: {
    id: 'monochrome',
    label: 'Monochrome',
    swatch: '#9a9a9a',
    lightScreenBg: '#f4f4f4',
    darkScreenBg: '#0e0e0e',
    lightBackground: {
      baseFill: '#f4f4f4',
      glowCenter: '#c8c8c8',
      glowMid: '#dedede',
      glowOuter: '#ececec',
      glowEdge: '#f4f4f4',
    },
    darkBackground: {
      baseFill: '#0e0e0e',
      glowCenter: '#3a3a3a',
      glowMid: '#222222',
      glowOuter: '#0e0e0e',
      glowEdge: '#0e0e0e',
    },
    lightColors: {
      beige: '#ebebeb',
      pinkHot: '#d4d4d4',
      pinkText: '#2a2a2a',
      pinkSoft: '#b8b8b8',
      blueDeep: '#1a1a1a',
      blueSoft: '#9a9a9a',
      blueMid: '#5c5c5c',
      ink: '#111111',
      inkSoft: 'rgba(17,17,17,0.62)',
      inkFaint: 'rgba(17,17,17,0.38)',
      blobPink: '#d8d8d8',
      blobLavender: '#e0e0e0',
      blobBlue: '#d0d0d0',
      blobPeach: '#dcdcdc',
      softBg: '#f4f4f4',
    },
    darkColors: {
      pinkText: '#e8e8e8',
      blueSoft: '#a0a0a0',
      ink: '#f2f2f2',
      inkSoft: 'rgba(242,242,242,0.72)',
      inkFaint: 'rgba(242,242,242,0.45)',
    },
    lightSurfaces: {
      pillActiveBg: 'rgba(0,0,0,0.08)',
      pillActiveBorder: 'rgba(0,0,0,0.12)',
      rowActive: 'rgba(0,0,0,0.06)',
      emojiCellActive: 'rgba(0,0,0,0.10)',
      ctaBg: '#111111',
      ctaText: '#ffffff',
    },
    darkSurfaces: {
      pillActiveBg: 'rgba(255,255,255,0.12)',
      pillActiveBorder: 'rgba(255,255,255,0.18)',
      rowActive: 'rgba(255,255,255,0.08)',
      emojiCellActive: 'rgba(255,255,255,0.14)',
      ctaBg: '#f5f5f5',
      ctaText: '#0e0e0e',
    },
  },
  beige: {
    id: 'beige',
    label: 'Beige & Pastel',
    swatch: '#FFC0CB',
    lightScreenBg: '#FDF5E6',
    darkScreenBg: '#1a1814',
    lightBackground: {
      baseFill: '#FDF5E6',
      glowCenter: '#FFC0CB',
      glowMid: '#FFD4DC',
      glowOuter: '#FFF8F0',
      glowEdge: '#FDF5E6',
    },
    darkBackground: {
      baseFill: '#1a1814',
      glowCenter: '#8a5a62',
      glowMid: '#3d6a66',
      glowOuter: '#1a1814',
      glowEdge: '#1a1814',
    },
    lightColors: {
      beige: '#FDF5E6',
      pinkHot: '#FFC0CB',
      pinkText: '#c87888',
      pinkSoft: '#ffd4dc',
      blueDeep: '#5a9e98',
      blueSoft: '#A4E5E0',
      blueMid: '#7ad4cc',
      blobPink: '#FFC0CB',
      blobLavender: '#FDF5E6',
      blobBlue: '#A4E5E0',
      blobPeach: '#ffe8d8',
      softBg: '#FDF5E6',
    },
    lightSurfaces: {
      pillActiveBg: 'rgba(255,192,203,0.55)',
      pillActiveBorder: 'rgba(200,120,136,0.28)',
      rowActive: 'rgba(255,192,203,0.28)',
      emojiCellActive: 'rgba(255,192,203,0.60)',
      ctaBg: '#FFC0CB',
      ctaText: '#1a1622',
    },
    darkSurfaces: {
      pillActiveBg: 'rgba(255,192,203,0.22)',
      pillActiveBorder: 'rgba(232,180,200,0.28)',
      rowActive: 'rgba(255,192,203,0.16)',
      emojiCellActive: 'rgba(255,192,203,0.28)',
      ctaBg: '#FFC0CB',
      ctaText: '#1a1622',
    },
  },
  cottonCandy: {
    id: 'cottonCandy',
    label: 'Cotton Candy',
    swatch: '#CCCCFF',
    lightScreenBg: '#ede8ff',
    darkScreenBg: '#141428',
    lightBackground: {
      baseFill: '#ede8ff',
      glowCenter: '#ffcccc',
      glowMid: '#CCCCFF',
      glowOuter: '#f0e8ff',
      glowEdge: '#ede8ff',
    },
    darkBackground: {
      baseFill: '#141428',
      glowCenter: '#6a4a6a',
      glowMid: '#3a3a6a',
      glowOuter: '#141428',
      glowEdge: '#141428',
    },
    lightColors: {
      beige: '#ede8ff',
      pinkHot: '#ffcccc',
      pinkText: '#b5456a',
      pinkSoft: '#f0a0b8',
      blueDeep: '#3d52b8',
      blueSoft: '#7a8ee8',
      blueMid: '#5a6fd4',
      blobPink: '#ffcccc',
      blobLavender: '#CCCCFF',
      blobBlue: '#b8c8ff',
      blobPeach: '#ffd8e8',
      softBg: '#ede8ff',
    },
    lightSurfaces: {
      pillActiveBg: 'rgba(204,204,255,0.55)',
      pillActiveBorder: 'rgba(90,111,212,0.25)',
      rowActive: 'rgba(255,204,204,0.35)',
      emojiCellActive: 'rgba(204,204,255,0.65)',
      ctaBg: '#5a6fd4',
      ctaText: '#ffffff',
    },
    darkSurfaces: {
      pillActiveBg: 'rgba(122,142,232,0.30)',
      pillActiveBorder: 'rgba(204,204,255,0.22)',
      ctaBg: '#9aa8f0',
      ctaText: '#121428',
    },
  },
};

const LEGACY_STYLE_IDS = new Set(['classic', 'sakura', 'ocean', 'forest']);

export function normalizeAppStyleId(stored: string | null | undefined): AppStyleId {
  if (stored && stored in APP_THEME_PRESETS) return stored as AppStyleId;
  if (stored && LEGACY_STYLE_IDS.has(stored)) return 'default';
  return 'default';
}

export function getAppThemePreset(id: AppStyleId): AppThemePreset {
  return APP_THEME_PRESETS[id];
}
