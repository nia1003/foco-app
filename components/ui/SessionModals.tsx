// ─────────────────────────────────────────────
// SessionModals — 微反思 & 分心記錄 Modal
// ─────────────────────────────────────────────
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';

const DISTRACTION_OPTIONS = [
  { label: '📱 Phone',                  key: 'Phone' },
  { label: '💬 Social media',           key: 'Social media' },
  { label: '🌀 Wandering thoughts',     key: 'Wandering thoughts' },
  { label: '😴 Tiredness',              key: 'Tiredness' },
  { label: '🔊 Other people',           key: 'Other people' },
  { label: '✅ None — stayed focused',  key: '__none__' },
];

// ── Reflection Modal ──────────────────────────
interface ReflectionModalProps {
  visible: boolean;
  onSubmit: (distraction: string) => void;
}

export function ReflectionModal({ visible, onSubmit }: ReflectionModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit(selected);
    setSelected(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>這段時間，有分心嗎？</Text>
          <Text style={styles.sub}>
            選一個最主要的原因，幫助你了解自己的專注模式。
          </Text>

          <View style={styles.chips}>
            {DISTRACTION_OPTIONS.map((opt) => {
              const active = selected === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelected(opt.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, !selected && styles.disabled]}
            disabled={!selected}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>Submit →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Distraction Counter Modal ──────────────────
interface DistractionCounterProps {
  visible: boolean;
  count: number;
  onClose: () => void;
}

export function DistractionCounter({ visible, count, onClose }: DistractionCounterProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
            <Text style={{ fontSize: 48 }}>😤</Text>
            <Text style={[styles.title, { textAlign: 'center', marginTop: Spacing.sm }]}>
              Distraction #{count}
            </Text>
            <Text style={[styles.sub, { textAlign: 'center' }]}>
              You got this. Refocus and keep going!
            </Text>
            <TouchableOpacity style={styles.submitBtn} onPress={onClose}>
              <Text style={styles.submitBtnText}>Back to focus →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  chipTextActive: { color: Colors.white },
  submitBtn: {
    marginTop: Spacing.sm,
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  submitBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
