import { Fonts } from '@/constants/fonts';
import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/hooks/useAppTheme';

export function createHomeStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    greeting: { marginTop: 8, paddingHorizontal: 22, paddingBottom: 4 },
    date: { fontSize: 13, color: colors.inkSoft },
    greet: {
      fontFamily: Fonts.display,
      fontSize: 32,
      fontWeight: '500',
      color: colors.ink,
      marginTop: 4,
      letterSpacing: -0.4,
      lineHeight: 38,
    },
    selectorSection: {
      marginTop: 20,
      overflow: 'visible',
      alignItems: 'center',
    },
    selectorHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      marginBottom: 12,
    },
    selectorEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.inkFaint,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    selectorAll: { fontSize: 13, fontWeight: '600', color: colors.pinkText },
    selectorHint: {
      fontSize: 11,
      color: colors.inkFaint,
      textAlign: 'center',
      marginTop: 10,
      letterSpacing: 0.3,
    },
    section: { marginTop: 14, paddingHorizontal: 18, marginBottom: 8, gap: 12 },
    setupBlock: { marginTop: 4 },
    startFocusBtn: {
      margin: 12,
      padding: 22,
      alignItems: 'center',
      gap: 6,
      borderRadius: 20,
      backgroundColor: surfaces.ctaBg,
    },
    startFocusEyebrowOnCta: {
      fontSize: 11,
      fontWeight: '700',
      color: surfaces.ctaText,
      opacity: 0.72,
      letterSpacing: 1.6,
    },
    startFocusLabel: {
      fontSize: 20,
      fontWeight: '700',
      color: surfaces.ctaText,
      letterSpacing: 2,
    },
  });
}
