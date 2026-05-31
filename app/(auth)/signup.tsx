/**
 * SignupScreen — Register Step 1: Enter email, send OTP
 */
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createAuthFormStyles } from '@/styles/authForm.styles';
import { authService } from '@/services/authService';
import { useApiCall } from '@/hooks/useApiCall';

export default function SignupScreen() {
  const { screenBg, colors } = useAppTheme();
  const styles = useThemedStyles(createAuthFormStyles);
  const router = useRouter();
  const { play } = useSound();
  const [email, setEmail] = useState('');

  const valid = email.includes('@') && email.includes('.');

  const { call: sendCode, loading, blocked, cooldown } = useApiCall(async () => {
    if (!valid) return;
    try {
      await authService.sendOtp(email.trim());
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
    } catch (err: any) {
      Alert.alert('發送失敗', err.message ?? '請確認 email 格式是否正確');
    }
  });

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          <FocoBar back />

          <View style={styles.cardWrap}>
            <FrostCard radius={32}>
              <Text style={styles.heading}>Create account</Text>
              <Text style={styles.sub}>Enter your email to get started.</Text>

              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.inkFaint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <View style={styles.underline} />
              </View>

              <Text style={[localStyles.hint, { color: colors.inkFaint }]}>
                We'll send a 6-digit verification code to this address.
              </Text>

              <TouchableOpacity
                style={[styles.continueBtn, (!valid || blocked) && styles.disabled]}
                disabled={!valid || blocked}
                onPress={() => { play('transition_up'); sendCode(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>
                  {loading ? 'SENDING…' : blocked ? `WAIT ${cooldown}s` : 'SEND CODE →'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchBtn}
                onPress={() => { play('tap'); router.replace('/(auth)/login'); }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchText}>
                  Already have an account?{' '}
                  <Text style={styles.switchLink}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </FrostCard>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  hint: { fontSize: 12, marginTop: 10, lineHeight: 17 },
});
