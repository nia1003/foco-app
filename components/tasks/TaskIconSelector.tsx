import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppTheme } from '@/hooks/useAppTheme';
import type { TaskIconValue } from '@/lib/taskIcon';
import { TaskIconPickerContent } from '@/components/tasks/TaskIconPickerContent';

interface Props {
  visible: boolean;
  value: TaskIconValue;
  onChange: (icon: TaskIconValue) => void;
  onClose: () => void;
}

export function TaskIconSelector({ visible, value, onChange, onClose }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <TaskIconPickerContent
            value={value}
            onChange={onChange}
            onDone={onClose}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles({ surfaces }: AppTheme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: surfaces.modalBackdrop,
      justifyContent: 'center',
      padding: 20,
    },
    sheet: {
      borderRadius: 24,
      backgroundColor: surfaces.modalSheetBg,
      borderWidth: 0.5,
      borderColor: surfaces.dividerStrong,
      padding: 20,
      maxHeight: '80%',
      overflow: 'hidden',
      elevation: 12,
      shadowColor: surfaces.shadowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
  });
}
