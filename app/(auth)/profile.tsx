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
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createAuthFormStyles } from '@/styles/authForm.styles';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { screenBg, colors } = useAppTheme();
  const styles = useThemedStyles(createAuthFormStyles);
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
      router.push('/(auth)/focus-type');
    } catch (err: any) {
      Alert.alert('設定失敗', err.message ?? '請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <FocoBar back />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={localStyles.scrollContent}>
            <FrostCard radius={32}>
              <Text style={styles.heading}>Set up your profile</Text>
              <Text style={styles.sub}>Almost there — just a few more details.</Text>

              {/* Name */}
              <Text style={[styles.label, localStyles.fieldLabel]}>YOUR NAME</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="What shall we call you?"
                  placeholderTextColor={colors.inkFaint}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <View style={styles.underline} />
              </View>

              {/* Password */}
              <Text style={[styles.label, { marginTop: 22 }]}>SET A PASSWORD</Text>
              <View style={styles.pwRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.inkFaint}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => { play('tap'); setShowPw((v) => !v); }} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.underline} />
              <Text style={[localStyles.pwHint, { color: colors.inkFaint }]}>You'll use this to sign in next time.</Text>

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

const localStyles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
  fieldLabel: { marginTop: 28, marginBottom: 8 },
  pwHint: { fontSize: 11, marginTop: 8 },
});
