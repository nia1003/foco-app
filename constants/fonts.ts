/** Loaded in app/_layout.tsx — use these keys everywhere instead of raw strings. */
export const Fonts = {
  /** Brand display — page titles, hero lines, focus card scores */
  display: 'Fraunces_500Medium',
  displayRegular: 'Fraunces_400Regular',
  displaySemiBold: 'Fraunces_600SemiBold',

  /** UI sans — body, buttons, labels, focus card metadata */
  ui: 'DMSans_400Regular',
  uiMedium: 'DMSans_500Medium',
  uiSemiBold: 'DMSans_600SemiBold',
  uiBold: 'DMSans_700Bold',

  /** Receipt / barcode — compact monospace document */
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemiBold: 'IBMPlexMono_600SemiBold',
} as const;

export type FontRole = keyof typeof Fonts;
