// ─────────────────────────────────────────────
// Button — 通用按鈕元件
// ─────────────────────────────────────────────
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Sizes
  size_sm: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, minHeight: 36 },
  size_md: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, minHeight: 48 },
  size_lg: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 56 },

  // Variants
  variant_primary: { backgroundColor: Colors.primary },
  variant_secondary: { backgroundColor: Colors.primaryMid },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  variant_ghost: { backgroundColor: 'transparent' },

  // Text
  text: { fontWeight: FontWeight.semibold },
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.white },
  text_outline: { color: Colors.primary },
  text_ghost: { color: Colors.primary },

  textSize_sm: { fontSize: FontSize.sm },
  textSize_md: { fontSize: FontSize.md },
  textSize_lg: { fontSize: FontSize.lg },
});
