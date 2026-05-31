import { TextStyle } from 'react-native';
import { Fonts } from '@/constants/fonts';

/** App-wide text presets (display + UI). Share-specific tuning lives in shareTypography.ts */
export const Typography = {
  displayHero: {
    fontFamily: Fonts.display,
    fontSize: 42,
    fontWeight: '500',
    letterSpacing: -0.5,
  } satisfies TextStyle,

  displayLarge: {
    fontFamily: Fonts.display,
    fontSize: 34,
    fontWeight: '500',
    letterSpacing: -0.4,
  } satisfies TextStyle,

  displayMedium: {
    fontFamily: Fonts.display,
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.3,
  } satisfies TextStyle,

  title: {
    fontFamily: Fonts.uiSemiBold,
    fontSize: 15,
    fontWeight: '600',
  } satisfies TextStyle,

  body: {
    fontFamily: Fonts.ui,
    fontSize: 15,
    fontWeight: '400',
  } satisfies TextStyle,

  bodyMedium: {
    fontFamily: Fonts.uiMedium,
    fontSize: 14,
    fontWeight: '500',
  } satisfies TextStyle,

  caption: {
    fontFamily: Fonts.ui,
    fontSize: 12,
    fontWeight: '400',
  } satisfies TextStyle,

  label: {
    fontFamily: Fonts.uiMedium,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  sectionEyebrow: {
    fontFamily: Fonts.uiSemiBold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  } satisfies TextStyle,
} as const;
