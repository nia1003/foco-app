/**
 * WelcomeScreen — iOS 26 Liquid Glass design.
 * SoftWallpaper (cream/pink/lavender) background with FrostCard sign-in panel.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { Colors } from '@/constants/theme';

function SignInButton({ children }: { children: React.ReactNode }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.signInBtn}>
      {children}
    </TouchableOpacity>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={styles.content}>
        {/* Hero wordmark */}
        <View style={styles.hero}>
          <Text style={styles.wordmark}>FOCO</Text>
          <Text style={styles.tagline}>Focus together, grow together</Text>
        </View>

        {/* Welcome card */}
        <View style={styles.cardWrap}>
          <FrostCard radius={32}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Ready to focus?</Text>

            {/* Sign-in buttons */}
            <View style={styles.signInRow}>
              <SignInButton>
                <Text style={styles.signinIcon}>🍎</Text>
              </SignInButton>
              <SignInButton>
                <Text style={[styles.signinIcon, { color: '#4285F4', fontWeight: '700' }]}>G</Text>
              </SignInButton>
              <SignInButton>
                <Text style={styles.signinIcon}>✉️</Text>
              </SignInButton>
            </View>

            <Text style={styles.tos}>
              By continuing you agree to our{' '}
              <Text style={{ color: Colors.inkSoft, textDecorationLine: 'underline' }}>Terms of Service</Text>.
            </Text>
          </FrostCard>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          style={styles.footerBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.footerText}>New here? Get started →</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>v 1.0  ·  est. 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.softBg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 54,
    paddingBottom: 30,
  },
  hero: {
    alignItems: 'center',
    marginTop: 16,
  },
  wordmark: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 38,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: 14,
    paddingLeft: 14,
  },
  tagline: {
    fontSize: 14,
    color: Colors.inkSoft,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  cardWrap: {
    marginTop: 56,
  },
  cardTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 30,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  cardSub: {
    fontSize: 15,
    color: Colors.inkSoft,
    marginTop: 6,
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 36,
  },
  signInBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.signInBtn,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(20,16,28,0.06)',
    shadowColor: '#3c2850',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  signinIcon: {
    fontSize: 20,
    color: Colors.ink,
  },
  tos: {
    fontSize: 12,
    color: Colors.inkFaint,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
  footerBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.inkSoft,
  },
  version: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    color: Colors.inkFaint,
    letterSpacing: 1.4,
  },
});
