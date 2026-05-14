// AUTO-GENERATED — do not edit manually.
// Source: tokens/tokens.json  |  Run: node tokens/build-tokens.mjs
// Copy this file to constants/theme.ts when tokens change.

// FOCO iOS 26 Liquid Glass palette
export const Colors = {
  // Brand palette
  beige: '#EFE8E0',
  pinkHot: '#E84797',
  pinkSoft: '#E7A0CC',
  blueDeep: '#203F9A',
  blueSoft: '#94C2DA',
  blueMid: '#4E7CB2',
  ink: '#1a1622',
  inkSoft: 'rgba(26,22,34,0.62)',
  inkFaint: 'rgba(26,22,34,0.38)',

  // SoftWallpaper blobs
  blobPink: '#f6cfdc',
  blobLavender: '#e8d5ec',
  blobBlue: '#d6e3f0',
  blobPeach: '#f9d8c7',
  softBg: '#faf5ef',

  // Glass surfaces
  glassChrome: 'rgba(255,255,255,0.78)',
  glassClear: 'rgba(255,255,255,0.55)',
  frostCard: 'rgba(255,255,255,0.62)',
  signInBtn: 'rgba(255,255,255,0.85)',

  // System colors
  white: '#FFFFFF',
  black: '#000000',
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',

  // Legacy aliases — keep old component references working
  primary: '#1a1622',       // was gray-900, now maps to ink
  primaryBlue: '#203F9A',   // blueDeep
  primaryMid: '#4E7CB2',    // blueMid
  textPrimary: '#1a1622',   // ink
  textSecondary: 'rgba(26,22,34,0.62)',  // inkSoft
  textDisabled: 'rgba(26,22,34,0.38)',   // inkFaint
  surface: 'rgba(255,255,255,0.78)',     // glassChrome
  surfaceMuted: 'rgba(255,255,255,0.40)',
  background: '#EFE8E0',    // beige
  border: 'rgba(255,255,255,0.60)',
  borderLight: 'rgba(255,255,255,0.60)',
} as const;

export const Spacing = {
  "xs": 4,
  "sm": 6,
  "md": 8,
  "lg": 12,
  "xl": 16,
  "2xl": 24,
  "xxl": 28,   // alias between 2xl and 3xl
  "3xl": 32,
  "4xl": 48
} as const;

export const Radius = {
  "xs": 4,
  "sm": 8,
  "md": 12,
  "lg": 16,
  "xl": 20,
  "2xl": 24,
  "3xl": 32,
  "full": 9999
} as const;

export const FontSize = {
  "xs": 12,
  "sm": 14,
  "base": 16,
  "md": 16,    // alias for base
  "lg": 18,
  "xl": 20,
  "2xl": 24,
  "xxl": 28,   // between 2xl and 3xl
  "3xl": 30,
  "4xl": 36,
  "display": 44,  // large hero titles
} as const;

export const FontWeight = {
  "extralight": "200",
  "light": "300",
  "normal": "400",
  "medium": "500",
  "semibold": "600",
  "bold": "700"
};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
};
