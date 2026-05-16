/**
 * VerifyScreen — Register Step 2: Enter 6-digit OTP
 */
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { authService } from '@/services/authService';

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = code.length === 6;

  const handleVerify = async () => {
    if (!valid || !email) return;
    try {
      setLoading(true);
      await authService.verifyOtp(email, code.trim());
      router.push({ pathname: '/(auth)/profile', params: { email } });
    } catch (err: any) {
      Alert.alert('驗證失敗', err.message ?? '驗證碼錯誤或已過期，請重新發送。');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.sendOtp(email ?? '');
      Alert.alert('已重新發送', '新的驗證碼已寄出，請檢查信箱。');
      setCode('');
    } catch (err: any) {
      Alert.alert('發送失敗', err.message ?? '請稍後再試');
    }
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <FocoBar back />

          <View style={styles.cardWrap}>
            <FrostCard radius={32}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>✉️</Text>
              </View>

              <Text style={styles.heading}>Check your inbox</Text>
              <Text style={styles.sub}>
                We sent a 6-digit code to{'\n'}
                <Text style={styles.emailText}>{email}</Text>
              </Text>

              <Text style={styles.label}>VERIFICATION CODE</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={Colors.inkFaint}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <View style={styles.underline} />
              </View>

              <TouchableOpacity
                style={[styles.verifyBtn, (!valid || loading) && styles.disabled]}
                disabled={!valid || loading}
                onPress={handleVerify}
                activeOpacity={0.85}
              >
                <Text style={styles.verifyBtnText}>
                  {loading ? 'VERIFYING…' : 'VERIFY →'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResend}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>
                  Didn't receive it?{' '}
                  <Text style={styles.resendLink}>Resend code</Text>
                </Text>
              </TouchableOpacity>
            </FrostCard>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
  cardWrap: { marginTop: 8 },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  icon: { fontSize: 40 },
  heading: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26, fontWeight: '500', color: Colors.ink,
    letterSpacing: -0.3, textAlign: 'center',
  },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emailText: { fontWeight: '600', color: Colors.ink },
  label: {
    fontSize: 11, fontWeight: '700', color: Colors.inkFaint,
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 28,
  },
  inputWrap: { paddingBottom: 4, marginTop: 6 },
  input: {
    fontSize: 28, fontWeight: '600', color: Colors.ink,
    paddingVertical: 6, letterSpacing: 6, textAlign: 'center',
  },
  underline: { height: 1.2, backgroundColor: 'rgba(20,16,28,0.15)', marginTop: 2 },
  verifyBtn: {
    marginTop: 28, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  verifyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2.5 },
  disabled: { opacity: 0.4 },
  resendBtn: { marginTop: 20, alignItems: 'center' },
  resendText: { fontSize: 13, color: Colors.inkFaint },
  resendLink: { color: Colors.ink, fontWeight: '600' },
});
