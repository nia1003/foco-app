import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/hooks/useAppTheme';

export function createAuthFormStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
    cardWrap: { marginTop: 8 },
    heading: {
      fontFamily: 'Fraunces_500Medium',
      fontSize: 26,
      fontWeight: '500',
      color: colors.ink,
      letterSpacing: -0.3,
    },
    sub: { fontSize: 14, color: colors.inkSoft, marginTop: 6 },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.inkFaint,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginTop: 24,
    },
    inputWrap: { paddingBottom: 4 },
    input: { fontSize: 18, fontWeight: '500', color: colors.ink, paddingVertical: 6 },
    pwRow: { flexDirection: 'row', alignItems: 'center' },
    eyeBtn: { paddingLeft: 12, paddingVertical: 6 },
    eyeIcon: { fontSize: 18 },
    underline: {
      height: 1.2,
      backgroundColor: surfaces.dividerStrong,
      marginTop: 2,
    },
    continueBtn: {
      marginTop: 32,
      paddingVertical: 16,
      borderRadius: 9999,
      backgroundColor: surfaces.ctaBg,
      alignItems: 'center',
      shadowColor: surfaces.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 6,
    },
    continueBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: surfaces.ctaText,
      letterSpacing: 3,
    },
    disabled: { opacity: 0.4 },
    switchBtn: { marginTop: 20, alignItems: 'center' },
    switchText: { fontSize: 13, color: colors.inkFaint },
    switchLink: { color: colors.ink, fontWeight: '600' },
  });
}

export function createAuthWelcomeStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 28, paddingTop: 72, justifyContent: 'space-between', paddingBottom: 48 },
    hero: { marginTop: 24 },
    brand: {
      fontFamily: 'Fraunces_500Medium',
      fontSize: 52,
      fontWeight: '500',
      color: colors.ink,
      letterSpacing: -1,
      lineHeight: 56,
    },
    tagline: { fontSize: 15, color: colors.inkSoft, marginTop: 12, lineHeight: 22 },
    emailBtn: {
      paddingVertical: 16,
      borderRadius: 9999,
      backgroundColor: surfaces.ctaBg,
      alignItems: 'center',
      marginBottom: 14,
    },
    emailBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: surfaces.ctaText,
      letterSpacing: 2.5,
    },
    ghostBtn: {
      paddingVertical: 16,
      borderRadius: 9999,
      borderWidth: 1.5,
      borderColor: surfaces.dividerStrong,
      alignItems: 'center',
    },
    ghostBtnText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft, letterSpacing: 1.5 },
  });
}

export function createAuthSimpleStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
    cardWrap: { marginTop: 8, flex: 1 },
    heading: {
      fontFamily: 'Fraunces_500Medium',
      fontSize: 26,
      fontWeight: '500',
      color: colors.ink,
      letterSpacing: -0.3,
    },
    sub: { fontSize: 14, color: colors.inkSoft, marginTop: 6, lineHeight: 20 },
    continueBtn: {
      marginTop: 28,
      paddingVertical: 16,
      borderRadius: 9999,
      backgroundColor: surfaces.ctaBg,
      alignItems: 'center',
    },
    continueBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: surfaces.ctaText,
      letterSpacing: 3,
    },
    disabled: { opacity: 0.4 },
  });
}
