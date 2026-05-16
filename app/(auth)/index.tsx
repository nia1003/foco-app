/**
 * WelcomeScreen — Choose Sign In or Create Account
 */
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { AppleIcon, GoogleIcon } from '@/components/ui/BrandIcons';
import { FrostCard } from '@/components/ui/FrostCard';
import { Colors } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { play } = useSound();

  const comingSoon = (provider: string) =>
    Alert.alert('即將推出', `${provider} 登入功能即將上線。`);

  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={styles.content}>
        {/* Hero wordmark */}
        <View style={styles.hero}>
          <Text style={styles.wordmark}>FOCO</Text>
          <Text style={styles.tagline}>Focus together, grow together</Text>
        </View>

        {/* Auth card */}
        <View style={styles.cardWrap}>
          <FrostCard radius={32}>
            <Text style={styles.cardTitle}>Get started</Text>
            <Text style={styles.cardSub}>Sign in or create a new account.</Text>

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => { play('tap'); comingSoon('Apple'); }}
                activeOpacity={0.75}
              >
                <AppleIcon size={20} color="#000" />
                <Text style={styles.socialLabel}>Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialBtn}
                onPress={() => { play('tap'); comingSoon('Google'); }}
                activeOpacity={0.75}
              >
                <GoogleIcon size={20} />
                <Text style={styles.socialLabel}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Sign In */}
            <TouchableOpacity
              style={styles.emailBtn}
              onPress={() => { play('transition_up'); router.push('/(auth)/login'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.emailBtnText}>SIGN IN WITH EMAIL</Text>
            </TouchableOpacity>

            {/* Create Account */}
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => { play('transition_up'); router.push('/(auth)/signup'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.createBtnText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </FrostCard>
        </View>
      </View>

      <Text style={styles.version}>v 1.0  ·  est. 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54, paddingBottom: 30 },
  hero: { alignItems: 'center', marginTop: 16 },
  wordmark: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 38, fontWeight: '500', color: Colors.ink,
    letterSpacing: 14, paddingLeft: 14,
  },
  tagline: { fontSize: 14, color: Colors.inkSoft, marginTop: 8, letterSpacing: 0.2 },
  cardWrap: { marginTop: 48 },
  cardTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28, fontWeight: '500', color: Colors.ink, letterSpacing: -0.4,
  },
  cardSub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6 },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 0.5, borderColor: 'rgba(20,16,28,0.1)',
  },
  socialIcon: { fontSize: 18, color: Colors.ink },
  socialLabel: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(20,16,28,0.15)' },
  dividerText: { fontSize: 12, color: Colors.inkFaint, letterSpacing: 0.5 },
  emailBtn: {
    paddingVertical: 15, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  emailBtnText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 2.5 },
  createBtn: {
    marginTop: 10, paddingVertical: 15, borderRadius: 9999,
    backgroundColor: 'transparent', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.ink,
  },
  createBtnText: { fontSize: 13, fontWeight: '700', color: Colors.ink, letterSpacing: 2.5 },
  version: {
    position: 'absolute', bottom: 30, left: 0, right: 0,
    textAlign: 'center', fontSize: 11, color: Colors.inkFaint, letterSpacing: 1.4,
  },
});
