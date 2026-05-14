/**
 * SignupScreen — "What shall we call you?" name input.
 * iOS 26 Liquid Glass: SoftWallpaper + FrostCard with serif heading.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');

  return (
    <View style={styles.root}>
      <AppBackground />
      <View style={styles.content}>
        <FocoBar back />

        <View style={styles.cardWrap}>
          <FrostCard radius={32}>
            {/* Sparkle icon */}
            <View style={styles.sparkleWrap}>
              <View style={styles.sparkleBox}>
                <Text style={styles.sparkle}>✦</Text>
              </View>
            </View>

            <Text style={styles.heading}>What shall we call you?</Text>

            {/* Underline input */}
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={Colors.inkFaint}
                autoFocus
              />
              <View style={styles.underline} />
            </View>

            <Text style={styles.hint}>This is what your companion will call you.</Text>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => router.push('/(auth)/profile')}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>CONTINUE</Text>
            </TouchableOpacity>
          </FrostCard>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54, paddingBottom: 30 },
  cardWrap: { marginTop: 8 },
  sparkleWrap: { alignItems: 'center', marginBottom: 14 },
  sparkleBox: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(20,16,28,0.06)',
  },
  sparkle: { fontSize: 22, color: Colors.pinkHot },
  heading: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26, fontWeight: '500', color: Colors.ink,
    textAlign: 'center', letterSpacing: -0.3,
  },
  inputWrap: { marginTop: 32, paddingBottom: 12 },
  input: {
    fontSize: 22, fontWeight: '500', color: Colors.ink,
    paddingVertical: 4,
  },
  underline: {
    height: 1.2, backgroundColor: Colors.ink, marginTop: 4,
  },
  hint: { fontSize: 12, color: Colors.inkFaint, marginTop: 10 },
  continueBtn: {
    marginTop: 32, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  continueBtnText: {
    fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3,
  },
});
