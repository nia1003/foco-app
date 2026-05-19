/**
 * TaskIconPickerContent — emoji / SVG grid (no Modal wrapper).
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSound } from '@/components/SoundProvider';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppTheme } from '@/hooks/useAppTheme';
import { TASK_EMOJI_OPTIONS, TASK_SVG_ICONS } from '@/constants/taskIcons';
import type { TaskIconValue } from '@/lib/taskIcon';
import type { TaskIconType } from '@/types';
import { TaskIcon } from '@/components/tasks/TaskIcon';

type Tab = TaskIconType;

interface Props {
  value: TaskIconValue;
  onChange: (icon: TaskIconValue) => void;
  onDone: () => void;
}

export function TaskIconPickerContent({ value, onChange, onDone }: Props) {
  const { play } = useSound();
  const styles = useThemedStyles(createStyles);
  const [tab, setTab] = useState<Tab>(value.type);

  const select = (icon: TaskIconValue) => {
    play('tap');
    onChange(icon);
  };

  return (
    <View>
      <Text style={styles.title}>Choose task icon</Text>

      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewIcon}>
          <TaskIcon icon={value} size={32} />
        </View>
      </View>

      <View style={styles.tabs}>
        {(['emoji', 'svg'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => {
              play('tap');
              setTab(t);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'emoji' ? 'Emoji' : 'Icons'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'emoji'
          ? TASK_EMOJI_OPTIONS.map((em) => {
              const active = value.type === 'emoji' && value.value === em;
              return (
                <TouchableOpacity
                  key={em}
                  style={[styles.cell, active && styles.cellActive]}
                  onPress={() => select({ type: 'emoji', value: em })}
                  activeOpacity={0.75}
                >
                  <Text style={styles.cellEmoji}>{em}</Text>
                </TouchableOpacity>
              );
            })
          : TASK_SVG_ICONS.map(({ id }) => {
              const active = value.type === 'svg' && value.value === id;
              const preview: TaskIconValue = { type: 'svg', value: id };
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.cell, active && styles.cellActive]}
                  onPress={() => select({ type: 'svg', value: id })}
                  activeOpacity={0.75}
                >
                  <TaskIcon icon={preview} size={22} />
                </TouchableOpacity>
              );
            })}
      </ScrollView>

      <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
      textAlign: 'center',
      marginBottom: 12,
    },
    preview: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: surfaces.modalInsetBg,
    },
    previewLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.inkFaint,
      letterSpacing: 1,
      marginBottom: 8,
    },
    previewIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: surfaces.modalSheetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
    },
    tabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: surfaces.modalInsetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
    },
    tabActive: {
      backgroundColor: surfaces.pillActiveBg,
      borderColor: surfaces.pillActiveBorder,
    },
    tabText: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
    tabTextActive: { color: colors.ink },
    gridScroll: { maxHeight: 280 },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
      paddingBottom: 8,
    },
    cell: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: surfaces.modalInsetBg,
    },
    cellActive: {
      backgroundColor: surfaces.emojiCellActive,
      borderWidth: 1.5,
      borderColor: colors.pinkText,
    },
    cellEmoji: { fontSize: 22 },
    doneBtn: {
      marginTop: 14,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: surfaces.ctaBg,
    },
    doneBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: surfaces.ctaText,
    },
  });
}
