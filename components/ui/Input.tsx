// ─────────────────────────────────────────────
// Input — 通用文字輸入元件
// ─────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  isPassword = false,
  style,
  accessibilityLabel,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputAccessibilityLabel = accessibilityLabel ?? label ?? props.placeholder;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : undefined]}>
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={Colors.textDisabled}
          accessibilityLabel={inputAccessibilityLabel}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  eyeBtn: { paddingHorizontal: Spacing.md },
  eyeText: { fontSize: 18 },
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginTop: Spacing.xs },
  hintText: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing.xs },
});
