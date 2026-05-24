import { Platform, StyleSheet } from 'react-native';
import type { AppTheme } from '@/hooks/useAppTheme';

const BG   = '#FFFFFF';
const CARD = '#F2F2F2';
const INK  = '#1a1622';

export function createStatsStyles({ colors }: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },
    flatCard: {
      backgroundColor: CARD,
      borderRadius: 20,
      overflow: 'hidden',
    },
    title: {
      fontFamily: 'Fraunces_500Medium',
      fontSize: 42,
      fontWeight: '500',
      color: INK,
      marginTop: 12,
      letterSpacing: -0.5,
    },
    sub: { fontSize: 13, color: 'rgba(26,22,34,0.55)', marginTop: 4 },
    summaryRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    summaryCard: { flex: 1 },
    summaryInner: { padding: 14 },
    summaryVal: {
      fontFamily: 'Fraunces_500Medium',
      fontSize: 22,
      fontWeight: '500',
      color: INK,
      letterSpacing: -0.4,
    },
    summaryLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: 'rgba(26,22,34,0.45)',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginTop: 6,
    },
    section: { marginTop: 12 },
    calEyebrow: {
      fontSize: 11,
      fontWeight: '700',
      color: 'rgba(26,22,34,0.45)',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    calInner: { padding: 16 },
    chartCard: { padding: 22, paddingTop: 26, overflow: 'visible' },
    chartTitle: { fontSize: 14, fontWeight: '600', color: INK },
    chartTitleLeft: { alignSelf: 'flex-start' },
    chartSub: {
      fontSize: 11,
      color: 'rgba(26,22,34,0.45)',
      marginTop: 4,
      marginBottom: 4,
      alignSelf: 'flex-start',
    },
    breakdownCardStretch: { alignItems: 'stretch', width: '100%' },
    periodModes: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 12,
      marginBottom: 4,
    },
    periodModeLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(26,22,34,0.40)',
    },
    periodModeLabelActive: { color: '#9B59D0' },
    chartNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    chartNavBtn: { padding: 4 },
    chartNavArrow: { fontSize: 22, color: 'rgba(26,22,34,0.55)', fontWeight: '300' },
    chartNavArrowDisabled: { opacity: 0.25 },
    chartPeriodLabel: {
      flex: 1,
      fontSize: 12,
      fontWeight: '500',
      color: 'rgba(26,22,34,0.55)',
      textAlign: 'center',
    },
    chartTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    chartTitleChevron: { fontSize: 20, color: 'rgba(26,22,34,0.40)' },
    selectedDetail: { marginTop: 10 },
    selectedDetailText: {
      fontSize: 12,
      color: 'rgba(26,22,34,0.55)',
      textAlign: 'center',
    },
    breakdownCard: { padding: 22, alignItems: 'center' },
    dominantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      marginBottom: 8,
    },
    dominantEmoji: { fontSize: 28, fontWeight: '700' },
    dominantInfo: { flex: 1 },
    dominantLabel: { fontSize: 15, fontWeight: '600', color: INK },
    dominantSub: { fontSize: 12, color: 'rgba(26,22,34,0.55)', marginTop: 2 },
    dominantBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
    },
    dominantBadgeText: { fontSize: 12, fontWeight: '700' },
    radarWrapper: { alignItems: 'center', marginTop: 4 },
    recentCard: { padding: 22 },
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(26,22,34,0.12)',
    },
    sessionDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      flexShrink: 0,
      backgroundColor: '#ECC5FE',
    },
    sessionInfo: { flex: 1 },
    sessionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: INK,
      textTransform: 'capitalize',
    },
    sessionSub: { fontSize: 11, color: 'rgba(26,22,34,0.55)', marginTop: 2 },
    sessionRight: { alignItems: 'flex-end', gap: 1 },
    sessionXP: {
      fontSize: 14,
      fontWeight: '700',
      color: INK,
      letterSpacing: -0.3,
    },
    sessionXPLabel: { fontSize: 9, color: 'rgba(26,22,34,0.45)', letterSpacing: 0.8 },
    shareOpenBtn: {
      marginTop: 20,
      backgroundColor: '#111111',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    shareOpenBtnText: {
      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: 2,
    },
  });
}

export function createCategoryChartStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    wrap: { gap: 14, marginTop: 8 },
    row: { gap: 6 },
    labelCol: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.ink,
      flex: 1,
      flexShrink: 1,
    },
    sub: { fontSize: 11, color: colors.inkSoft },
    barTrack: {
      height: 8,
      borderRadius: 9999,
      backgroundColor: surfaces.chartTrack,
      overflow: 'hidden',
    },
    barFill: { height: 8, borderRadius: 9999 },
    empty: {
      fontSize: 12,
      color: colors.inkFaint,
      textAlign: 'center',
      paddingVertical: 16,
    },
  });
}

export function createLineChartLabelStyles({ colors }: AppTheme) {
  return StyleSheet.create({
    dayRow: { flexDirection: 'row', paddingHorizontal: 4, marginTop: 2 },
    dayBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
    dayLabel: { fontSize: 11, color: colors.inkFaint, fontWeight: '500' },
    dayLabelActive: { color: colors.ink, fontWeight: '700' },
  });
}
