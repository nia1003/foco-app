/**
 * DurationPickerModal — full-screen overlay to adjust focus duration.
 */
import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircularDurationPicker } from '@/components/ui/CircularDurationPicker';
import { useSound } from '@/components/SoundProvider';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppTheme } from '@/hooks/useAppTheme';

const DURATION_PRESETS = [15, 25, 30, 45, 50, 60] as const;

interface Props {
  visible: boolean;
  value: number;
  onChange: (minutes: number) => void;
  onClose: () => void;
}

export function DurationPickerModal({ visible, value, onChange, onClose }: Props) {
  const { play } = useSound();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const handleClose = () => {
    play('tap');
    onChange(draft);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 8 }]}
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Duration</Text>

        <View style={styles.presetsRow}>
          {DURATION_PRESETS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.presetChip, draft === m && styles.presetChipActive]}
              onPress={() => {
                play('tap');
                setDraft(m);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.presetLabel, draft === m && styles.presetLabelActive]}>
                {m}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CircularDurationPicker value={draft} onChange={setDraft} />

        <Text style={styles.hint}>Drag the ring or tap the number to type</Text>
      </View>
    </Modal>
  );
}

function createStyles({ colors, surfaces }: AppTheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: surfaces.modalSheetBg,
      paddingHorizontal: 20,
    },
    closeBtn: {
      position: 'absolute',
      right: 16,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: surfaces.modalInsetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
    },
    closeText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.inkSoft,
    },
    title: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.inkFaint,
      letterSpacing: 1.6,
      textAlign: 'center',
      marginTop: 48,
      marginBottom: 20,
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
      marginBottom: 16,
    },
    presetChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 9999,
      backgroundColor: surfaces.modalInsetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
    },
    presetChipActive: {
      backgroundColor: surfaces.pillActiveBg,
      borderColor: surfaces.pillActiveBorder,
    },
    presetLabel: { fontSize: 13, fontWeight: '600', color: colors.inkSoft },
    presetLabelActive: { color: colors.ink },
    hint: {
      fontSize: 12,
      color: colors.inkFaint,
      textAlign: 'center',
      marginTop: 12,
    },
  });
}
