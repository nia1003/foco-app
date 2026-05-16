/**
 * SignupScreen — Register Step 1: Enter email, send OTP
 */
import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { authService } from '@/services/authService';

export default function SignupScreen() {
  const router = useRouter();
  const { play } = useSound();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = email.includes('@') && email.includes('.');

  const handleSendCode = async () => {
    if (!valid) return;
    try {
      setLoading(true);
      await authService.sendOtp(email.trim());
      router.push({ pathname: '/(auth)/verify', params: { email: email.trim() } });
    } catch (err: any) {
      Alert.alert('發送失敗', err.message ?? '請確認 email 格式是否正確');
    } finally {
      setLoading(false);
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
              <Text style={styles.heading}>Create account</Text>
              <Text style={styles.sub}>Enter your email to get started.</Text>

              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.inkFaint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <View style={styles.underline} />
              </View>

              <Text style={styles.hint}>
                We'll send a 6-digit verification code to this address.
              </Text>

              <TouchableOpacity
                style={[styles.sendBtn, (!valid || loading) && styles.disabled]}
                disabled={!valid || loading}
                onPress={() => { play('transition_up'); handleSendCode(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.sendBtnText}>
                  {loading ? 'SENDING…' : 'SEND CODE →'}
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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
  cardWrap: { marginTop: 8 },
  heading: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26, fontWeight: '500', color: Colors.ink, letterSpacing: -0.3,
  },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6 },
  label: {
    fontSize: 11, fontWeight: '700', color: Colors.inkFaint,
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 28,
  },
  inputWrap: { paddingBottom: 4, marginTop: 6 },
  input: { fontSize: 18, fontWeight: '500', color: Colors.ink, paddingVertical: 6 },
  underline: { height: 1.2, backgroundColor: 'rgba(20,16,28,0.15)', marginTop: 2 },
  hint: { fontSize: 12, color: Colors.inkFaint, marginTop: 10, lineHeight: 17 },
  sendBtn: {
    marginTop: 28, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  sendBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2.5 },
  disabled: { opacity: 0.4 },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { fontSize: 13, color: Colors.inkFaint },
  switchLink: { color: Colors.ink, fontWeight: '600' },
});
