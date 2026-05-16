/**
 * ProfileScreen — Register Step 3: Set name + password
 * OTP 驗證後呼叫，補齊用戶名字與密碼
 */
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { play } = useSound();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = name.trim().length > 0 && password.length >= 6 && !loading;

  const handleContinue = async () => {
    if (!canSubmit) return;
    play('transition_up');
    try {
      setLoading(true);
      // 更新密碼與名字到 Supabase auth user
      const { error } = await supabase.auth.updateUser({
        password,
        data: { name: name.trim() },
      });
      if (error) throw error;
      router.push('/(auth)/consent');
    } catch (err: any) {
      Alert.alert('設定失敗', err.message ?? '請稍後再試');
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <FrostCard radius={32}>
              <Text style={styles.heading}>Set up your profile</Text>
              <Text style={styles.sub}>Almost there — just a few more details.</Text>

              {/* Name */}
              <Text style={styles.fieldLabel}>YOUR NAME</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="What shall we call you?"
                  placeholderTextColor={Colors.inkFaint}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <View style={styles.underline} />
              </View>

              {/* Password */}
              <Text style={[styles.fieldLabel, { marginTop: 22 }]}>SET A PASSWORD</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={Colors.inkFaint}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => { play('tap'); setShowPw((v) => !v); }} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.underline} />
              <Text style={styles.pwHint}>You'll use this to sign in next time.</Text>

              <TouchableOpacity
                style={[styles.continueBtn, !canSubmit && styles.disabled]}
                onPress={handleContinue}
                disabled={!canSubmit}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>
                  {loading ? 'SAVING…' : 'CONTINUE →'}
                </Text>
              </TouchableOpacity>
            </FrostCard>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
  scrollContent: { paddingBottom: 40 },
  heading: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26, fontWeight: '500', color: Colors.ink, letterSpacing: -0.3,
  },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6 },
  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.inkFaint,
    letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 28, marginBottom: 8,
  },
  inputWrap: { paddingBottom: 8 },
  input: { fontSize: 17, fontWeight: '500', color: Colors.ink, paddingVertical: 4 },
  pwRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { paddingLeft: 12, paddingVertical: 6 },
  eyeIcon: { fontSize: 18 },
  underline: { height: 1.2, backgroundColor: 'rgba(20,16,28,0.18)', marginTop: 4 },
  pwHint: { fontSize: 11, color: Colors.inkFaint, marginTop: 8 },
  continueBtn: {
    marginTop: 28, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3 },
  disabled: { opacity: 0.4 },
});
