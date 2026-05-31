import { Fonts } from '@/constants/fonts';
import { StyleSheet } from 'react-native';
import type { AppTheme } from '@/hooks/useAppTheme';

const BTN_SIZE = 36;

export function createMissionGridStyles({ colors, surfaces, screenBg }: AppTheme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: screenBg },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 120 },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      marginBottom: 4,
    },
    title: {
      fontFamily: Fonts.display,
      fontSize: 42,
      fontWeight: '500',
      color: colors.ink,
      letterSpacing: -0.5,
    },
    addBtn: {
      height: BTN_SIZE,
      backgroundColor: surfaces.ctaBg,
      borderRadius: 9999,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: surfaces.ctaText,
    },

    tabs: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 4 },
    tabPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 9999,
      backgroundColor: surfaces.panelBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.panelBorder,
    },
    tabPillActive: {
      backgroundColor: surfaces.ctaBg,
      borderColor: surfaces.ctaBg,
    },
    tabLabel: { fontSize: 13, fontWeight: '500', color: colors.inkSoft },
    tabLabelActive: { color: surfaces.ctaText, fontWeight: '600' },

    sectionLabel: {
      fontSize: 13,
      color: colors.inkSoft,
      letterSpacing: 0.2,
      marginTop: 24,
      marginBottom: 12,
    },

    taskCard: {
      width: '48%',
      height: 135,
      backgroundColor: surfaces.panelBg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: surfaces.panelBorder,
      paddingHorizontal: 18,
      paddingVertical: 16,
      position: 'relative',
    },
    taskGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    emptyCard: {
      width: '100%',
      height: 'auto',
      justifyContent: 'center',
      paddingHorizontal: 18,
      paddingVertical: 16,
    },
    taskOpenArea: { flex: 1 },
    taskTextBlock: { paddingRight: 24, alignItems: 'flex-start' },
    taskIconWrap: {
      position: 'absolute',
      left: 16,
      bottom: 16,
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: surfaces.emojiCellBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskTitle: { fontSize: 13, fontWeight: '700', color: colors.ink, lineHeight: 17 },
    emptyText: {
      fontSize: 13,
      color: colors.inkFaint,
      textAlign: 'center',
      paddingVertical: 8,
    },
    startBtn: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: BTN_SIZE,
      height: BTN_SIZE,
      borderRadius: BTN_SIZE / 2,
      backgroundColor: surfaces.ctaBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startIcon: { fontSize: 16, color: surfaces.ctaText, fontWeight: '700' },
    deleteBtn: {
      position: 'absolute',
      top: 10,
      right: 12,
      padding: 4,
    },
    deadlineBadge: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.pinkText,
      letterSpacing: 0.1,
      marginTop: 4,
    },
    deadlineOverdue: { color: colors.error },
  });
}

export type MissionGridStyles = ReturnType<typeof createMissionGridStyles>;
