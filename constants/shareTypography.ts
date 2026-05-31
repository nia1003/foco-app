import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/fonts';

/** Receipt paper — tight IBM Plex Mono */
export const receiptType = StyleSheet.create({
  brand: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 26,
    letterSpacing: 0.4,
    textAlign: 'center',
    color: '#111',
  },
  brandSub: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    letterSpacing: 0.8,
    textAlign: 'center',
    color: '#111',
  },
  rule: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: 'rgba(20,16,28,0.35)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: 'rgba(20,16,28,0.55)',
    letterSpacing: 0.2,
  },
  value: {
    fontFamily: Fonts.monoMedium,
    fontSize: 13,
    color: '#111',
    letterSpacing: 0,
  },
  sectionLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: 12,
    color: 'rgba(20,16,28,0.45)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  logLine: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: '#111',
    letterSpacing: 0,
  },
  hint: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: 'rgba(20,16,28,0.4)',
    letterSpacing: 0.3,
  },
  barcode: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#111',
  },
});

/** Focus share card — Fraunces display + DM Sans body */
export const focusCardType = StyleSheet.create({
  brand: {
    fontFamily: Fonts.display,
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
    color: '#111',
  },
  brandSub: {
    fontFamily: Fonts.ui,
    fontSize: 12,
    color: 'rgba(20,16,28,0.45)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  rule: {
    fontFamily: Fonts.ui,
    fontSize: 11,
    color: 'rgba(20,16,28,0.22)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  score: {
    fontFamily: Fonts.display,
    fontSize: 48,
    fontWeight: '500',
    letterSpacing: -0.5,
    lineHeight: 52,
    includeFontPadding: false,
  },
  scoreTag: {
    fontFamily: Fonts.uiSemiBold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  scoreSub: {
    fontFamily: Fonts.ui,
    fontSize: 12,
    color: 'rgba(20,16,28,0.45)',
    marginTop: 2,
  },
  dataLabel: {
    fontFamily: Fonts.uiMedium,
    fontSize: 11,
    color: 'rgba(20,16,28,0.42)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dataValue: {
    fontFamily: Fonts.uiSemiBold,
    fontSize: 13,
    color: '#111',
    fontWeight: '600',
  },
  timelineLabel: {
    fontFamily: Fonts.uiMedium,
    fontSize: 10,
    color: 'rgba(20,16,28,0.38)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shareBtn: {
    fontFamily: Fonts.uiSemiBold,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    fontFamily: Fonts.ui,
    fontSize: 10,
    color: 'rgba(20,16,28,0.28)',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});

/** Share modal chrome (tabs, nav) — UI sans, not receipt mono */
export const shareChromeType = StyleSheet.create({
  tab: {
    fontFamily: Fonts.uiMedium,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  close: {
    fontFamily: Fonts.ui,
    fontSize: 14,
    letterSpacing: 0.1,
  },
  nav: {
    fontFamily: Fonts.ui,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  action: {
    fontFamily: Fonts.uiSemiBold,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
