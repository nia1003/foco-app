import { Fonts } from '@/constants/fonts';
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
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { createAuthWelcomeStyles } from '@/styles/authForm.styles';

export default function WelcomeScreen() {
  const { screenBg, colors, surfaces } = useAppTheme();
  const welcomeStyles = useThemedStyles(createAuthWelcomeStyles);
  const router = useRouter();
  const { play } = useSound();

  const comingSoon = (provider: string) =>
    Alert.alert('即將推出', `${provider} 登入功能即將上線。`);

  return (
    <View style={[welcomeStyles.root, { backgroundColor: screenBg }]}>
      <AppBackground />

      <View style={localStyles.content}>
        {/* Hero wordmark */}
        <View style={localStyles.hero}>
          <Text style={[localStyles.wordmark, { color: colors.ink }]}>FOCO</Text>
          <Text style={welcomeStyles.tagline}>Focus together, grow together</Text>
        </View>

        {/* Auth card */}
        <View style={localStyles.cardWrap}>
          <FrostCard radius={32}>
            <Text style={[localStyles.cardTitle, { color: colors.ink }]}>Get started</Text>
            <Text style={[localStyles.cardSub, { color: colors.inkSoft }]}>Sign in or create a new account.</Text>

            {/* Social buttons */}
            <View style={localStyles.socialRow}>
              <TouchableOpacity
                style={localStyles.socialBtn}
                onPress={() => { play('tap'); comingSoon('Apple'); }}
                activeOpacity={0.75}
              >
                <AppleIcon size={20} color="#000" />
                <Text style={[localStyles.socialLabel, { color: colors.ink }]}>Apple</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={localStyles.socialBtn}
                onPress={() => { play('tap'); comingSoon('Google'); }}
                activeOpacity={0.75}
              >
                <GoogleIcon size={20} />
                <Text style={[localStyles.socialLabel, { color: colors.ink }]}>Google</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={localStyles.dividerRow}>
              <View style={[localStyles.dividerLine, { backgroundColor: surfaces.dividerStrong }]} />
              <Text style={[localStyles.dividerText, { color: colors.inkFaint }]}>or</Text>
              <View style={[localStyles.dividerLine, { backgroundColor: surfaces.dividerStrong }]} />
            </View>

            {/* Email Sign In */}
            <TouchableOpacity
              style={welcomeStyles.emailBtn}
              onPress={() => { play('transition_up'); router.push('/(auth)/login'); }}
              activeOpacity={0.85}
            >
              <Text style={welcomeStyles.emailBtnText}>SIGN IN WITH EMAIL</Text>
            </TouchableOpacity>

            {/* Create Account */}
            <TouchableOpacity
              style={welcomeStyles.ghostBtn}
              onPress={() => { play('transition_up'); router.push('/(auth)/signup'); }}
              activeOpacity={0.85}
            >
              <Text style={welcomeStyles.ghostBtnText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </FrostCard>
        </View>
      </View>

      <Text style={[localStyles.version, { color: colors.inkFaint }]}>v 1.0  ·  est. 2026</Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54, paddingBottom: 30 },
  hero: { alignItems: 'center', marginTop: 16 },
  wordmark: {
    fontFamily: Fonts.display,
    fontSize: 38, fontWeight: '500',
    letterSpacing: 14, paddingLeft: 14,
  },
  cardWrap: { marginTop: 48 },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 28, fontWeight: '500', letterSpacing: -0.4,
  },
  cardSub: { fontSize: 14, marginTop: 6 },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 0.5, borderColor: 'rgba(20,16,28,0.1)',
  },
  socialLabel: { fontSize: 14, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 0.5 },
  dividerText: { fontSize: 12, letterSpacing: 0.5 },
  version: {
    position: 'absolute', bottom: 30, left: 0, right: 0,
    textAlign: 'center', fontSize: 11, letterSpacing: 1.4,
  },
});
