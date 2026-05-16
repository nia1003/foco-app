/**
 * ProfileScreen — 選擇目標 + 輸入 Email / 密碼 → 建立帳號
 * 接收 signup.tsx 傳來的 name，最後呼叫 authService.signup
 */
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
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

const GOALS = [
  { id: 'study',  label: '📚 Study',  sub: 'Coursework & research' },
  { id: 'work',   label: '💼 Work',   sub: 'Deep work & projects' },
  { id: 'create', label: '🎨 Create', sub: 'Art, writing & music' },
  { id: 'habits', label: '🌱 Habits', sub: 'Daily routines' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name?: string }>();

  const [selected, setSelected] = useState<string>('study');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading;

  const handleSignup = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      await authService.signup(email.trim(), password, name ?? 'User');
      // authStore.onAuthStateChange 會自動更新 → _layout 路由守衛跳轉 Home
      // 但先走完 onboarding 體驗：去選寵物
      router.push('/(auth)/pet');
    } catch (err: any) {
      Alert.alert('註冊失敗', err.message ?? '請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <View style={styles.content}>
        <FocoBar back />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <FrostCard radius={32}>
            <Text style={styles.heading}>What's your main focus?</Text>
            <Text style={styles.sub}>We'll personalise your experience.</Text>

            {/* Goal grid */}
            <View style={styles.grid}>
              {GOALS.map((g) => {
                const active = selected === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.tile, active && styles.tileActive]}
                    onPress={() => setSelected(g.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.tileEmoji}>{g.label.split(' ')[0]}</Text>
                    <Text style={[styles.tileLabel, active && styles.tileLabelActive]}>
                      {g.label.split(' ').slice(1).join(' ')}
                    </Text>
                    <Text style={styles.tileSub}>{g.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Email */}
            <Text style={styles.fieldLabel}>EMAIL</Text>
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
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>PASSWORD</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor={Colors.inkFaint}
                secureTextEntry
              />
              <View style={styles.underline} />
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, !canSubmit && styles.disabled]}
              onPress={handleSignup}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>
                {loading ? 'CREATING ACCOUNT…' : 'GET STARTED →'}
              </Text>
            </TouchableOpacity>
          </FrostCard>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
  scrollContent: { paddingBottom: 40 },
  heading: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26, fontWeight: '500', color: Colors.ink, letterSpacing: -0.3,
  },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  tile: {
    width: '47%', padding: 16, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
  },
  tileActive: {
    backgroundColor: 'rgba(232,71,151,0.12)',
    borderColor: 'rgba(232,71,151,0.4)',
  },
  tileEmoji: { fontSize: 24, marginBottom: 6 },
  tileLabel: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  tileLabelActive: { color: Colors.pinkHot },
  tileSub: { fontSize: 11, color: Colors.inkFaint, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(20,16,28,0.12)',
    marginVertical: 24,
  },
  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.inkFaint,
    letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8,
  },
  inputWrap: { paddingBottom: 8 },
  input: {
    fontSize: 17, fontWeight: '500', color: Colors.ink, paddingVertical: 4,
  },
  underline: {
    height: 1.2, backgroundColor: 'rgba(20,16,28,0.18)', marginTop: 4,
  },
  continueBtn: {
    marginTop: 28, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3 },
  disabled: { opacity: 0.4 },
});
