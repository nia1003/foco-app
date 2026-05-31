import { Fonts } from '@/constants/fonts';
import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/hooks/useAppTheme';

export function createReflectionSliderStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    wrap: { marginTop: 8, marginBottom: 4 },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    valueText: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.pinkText,
      letterSpacing: -0.5,
    },
    valueHint: { fontSize: 12, color: colors.inkFaint },
    track: {
      height: 6,
      borderRadius: 9999,
      backgroundColor: surfaces.chartTrack,
      justifyContent: 'center',
    },
    fill: {
      position: 'absolute',
      left: 0,
      height: 6,
      borderRadius: 9999,
      backgroundColor: colors.pinkHot,
    },
    thumb: {
      position: 'absolute',
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.white,
      borderWidth: 2.5,
      borderColor: colors.pinkText,
      top: -10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.14,
      shadowRadius: 4,
      elevation: 3,
    },
    endLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    endLabel: { fontSize: 10, color: colors.inkFaint },
  });
}

export function createReflectionStyles({ colors, surfaces, screenBg }: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: screenBg },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 60 },

    headingBlock: { marginBottom: 36 },
    heading: {
      fontFamily: Fonts.display,
      fontSize: 34,
      fontWeight: '500',
      color: colors.ink,
      letterSpacing: -0.6,
      marginBottom: 6,
    },
    sub: { fontSize: 14, color: colors.inkSoft, lineHeight: 20 },

    section: {
      marginBottom: 36,
      backgroundColor: surfaces.panelBg,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: surfaces.panelBorder,
      padding: 20,
    },
    qLabel: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 },
    qHint: { fontSize: 12, color: colors.inkFaint, marginBottom: 14 },

    tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 9999,
      backgroundColor: surfaces.emojiCellBg,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    tagActive: {
      backgroundColor: surfaces.rowActive,
      borderColor: colors.pinkText,
    },
    tagText: { fontSize: 13, fontWeight: '500', color: colors.inkSoft },
    tagTextActive: { color: colors.pinkText, fontWeight: '700' },

    moodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    moodBtn: {
      alignItems: 'center',
      gap: 4,
      flex: 1,
      paddingVertical: 10,
      borderRadius: 14,
    },
    moodBtnActive: { backgroundColor: surfaces.rowActive },
    moodEmoji: { fontSize: 26 },
    moodLabel: { fontSize: 10, color: colors.inkFaint, letterSpacing: 0.2 },

    submitBtn: {
      paddingVertical: 17,
      borderRadius: 9999,
      backgroundColor: surfaces.ctaBg,
      alignItems: 'center',
      shadowColor: surfaces.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 6,
      marginBottom: 12,
    },
    submitText: {
      fontSize: 15,
      fontWeight: '700',
      color: surfaces.ctaText,
      letterSpacing: 2,
    },
    skipBtn: { paddingVertical: 12, alignItems: 'center' },
    skipText: { fontSize: 13, color: colors.inkFaint },
  });
}
