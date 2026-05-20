/**
 * LoginScreen — Email + Password 登入
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
import { Colors } from '@/constants/theme';
import { authService } from '@/services/authService';
import { useApiCall } from '@/hooks/useApiCall';

export default function LoginScreen() {
  const router = useRouter();
  const { play } = useSound();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const valid = email.includes('@') && password.length >= 6;

  const { call: login, loading, blocked, cooldown } = useApiCall(async () => {
    if (!valid) return;
    try {
      await authService.login(email, password);
      // 成功後 authStore.onAuthStateChange 觸發，_layout.tsx 路由守衛自動跳 Home
    } catch (err: any) {
      Alert.alert('登入失敗', err.message ?? '請確認信箱與密碼');
    }
  });

  return (
    <View style={styles.root}>
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
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.sub}>Sign in to continue with your companion.</Text>

              {/* Email */}
              <Text style={styles.label}>Email</Text>
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
                />
                <View style={styles.underline} />
              </View>

              {/* Password */}
              <Text style={[styles.label, { marginTop: 20 }]}>Password</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••"
                  placeholderTextColor={Colors.inkFaint}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => { play('tap'); setShowPw((v) => !v); }} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.underline} />

              <TouchableOpacity
                style={[styles.continueBtn, (!valid || blocked) && styles.disabled]}
                disabled={!valid || blocked}
                onPress={() => { play('transition_up'); login(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>
                  {loading ? 'Signing in…' : blocked ? `WAIT ${cooldown}s` : 'SIGN IN →'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchBtn}
                onPress={() => { play('tap'); router.replace('/(auth)/signup'); }}
                activeOpacity={0.7}
              >
                <Text style={styles.switchText}>
                  Don't have an account?{' '}
                  <Text style={styles.switchLink}>Create one</Text>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
  cardWrap: { marginTop: 8 },
  heading: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 24,
  },
  inputWrap: { paddingBottom: 4 },
  input: { fontSize: 18, fontWeight: '500', color: Colors.ink, paddingVertical: 6 },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { paddingLeft: 12, paddingVertical: 6 },
  eyeIcon: { fontSize: 18 },
  underline: { height: 1.2, backgroundColor: 'rgba(20,16,28,0.15)', marginTop: 2 },
  continueBtn: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3 },
  disabled: { opacity: 0.4 },
  switchBtn: { marginTop: 20, alignItems: 'center' },
  switchText: { fontSize: 13, color: Colors.inkFaint },
  switchLink: { color: Colors.ink, fontWeight: '600' },
});
