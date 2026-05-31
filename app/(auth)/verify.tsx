/**
 * VerifyScreen — Register Step 2: Enter 6-digit OTP
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createAuthFormStyles } from '@/styles/authForm.styles';
import { authService } from '@/services/authService';
import { useApiCall } from '@/hooks/useApiCall';

export default function VerifyScreen() {
  const { screenBg, colors } = useAppTheme();
  const styles = useThemedStyles(createAuthFormStyles);
  const router = useRouter();
  const { play } = useSound();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');

  const valid = code.length === 6;

  const { call: verify, loading: verifying, blocked: verifyBlocked, cooldown: verifyCooldown } =
    useApiCall(async () => {
      if (!valid || !email) return;
      play('transition_up');
      try {
        await authService.verifyOtp(email, code.trim());
        router.push({ pathname: '/(auth)/profile', params: { email } });
      } catch (err: any) {
        Alert.alert('驗證失敗', err.message ?? '驗證碼錯誤或已過期，請重新發送。');
        setCode('');
      }
    });

  const { call: resend, loading: resending, blocked: resendBlocked, cooldown: resendCooldown } =
    useApiCall(async () => {
      play('tap');
      try {
        await authService.sendOtp(email ?? '');
        Alert.alert('已重新發送', '新的驗證碼已寄出，請檢查信箱。');
        setCode('');
      } catch (err: any) {
        Alert.alert('發送失敗', err.message ?? '請稍後再試');
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
              <View style={localStyles.iconWrap}>
                <Text style={localStyles.icon}>✉️</Text>
              </View>

              <Text style={[styles.heading, localStyles.centered]}>Check your inbox</Text>
              <Text style={[styles.sub, localStyles.centered]}>
                We sent a 6-digit code to{'\n'}
                <Text style={[localStyles.emailText, { color: colors.ink }]}>{email}</Text>
              </Text>

              <Text style={styles.label}>VERIFICATION CODE</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, localStyles.codeInput]}
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={colors.inkFaint}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <View style={styles.underline} />
              </View>

              <TouchableOpacity
                style={[styles.continueBtn, (!valid || verifyBlocked) && styles.disabled]}
                disabled={!valid || verifyBlocked}
                onPress={verify}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>
                  {verifying ? 'VERIFYING…' : verifyBlocked ? `WAIT ${verifyCooldown}s` : 'VERIFY →'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[localStyles.resendBtn, resendBlocked && localStyles.resendBlocked]}
                disabled={resendBlocked}
                onPress={resend}
                activeOpacity={0.7}
              >
                <Text style={styles.switchText}>
                  {resending
                    ? 'Sending…'
                    : resendBlocked
                      ? `Resend in ${resendCooldown}s`
                      : <Text>Didn't receive it? <Text style={styles.switchLink}>Resend code</Text></Text>
                  }
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
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 40 },
  centered: { textAlign: 'center' },
  emailText: { fontWeight: '600' },
  codeInput: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 6,
    textAlign: 'center',
  },
  resendBtn: { marginTop: 20, alignItems: 'center' },
  resendBlocked: { opacity: 0.4 },
});
