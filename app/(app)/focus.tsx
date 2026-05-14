/**
 * FocusScreen — Pomodoro timer (light iOS 26 style).
 * Design: white/warm bg, large numerals, peach orb glow, Restart/Pause/Done controls.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { PETS } from '@/constants/pets';

const activePet = PETS[0];
import { Glass } from '@/components/ui/Glass';
import { TabBar } from '@/components/layout/TabBar';
import { Colors } from '@/constants/theme';

const TOTAL = 25 * 60; // 25 min default

export default function FocusScreen() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(TOTAL);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse the orb when running
  useEffect(() => {
    if (running) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [running]);

  // Countdown
  useEffect(() => {
    if (running && seconds > 0) {
      timerRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (seconds === 0) setRunning(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, seconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const progress = 1 - seconds / TOTAL;

  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={styles.headerBtnText}>+ Task</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flow State</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={styles.headerBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Orb + timer */}
        <View style={styles.orbWrap}>
          <Animated.View style={[styles.orbOuter, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.orbInner}>
              <Text style={styles.timerNumerals}>{mm}:{ss}</Text>
              <Text style={styles.timerCaption}>Flow State</Text>
              <Image source={activePet.image} style={styles.petImage} resizeMode="contain" />
            </View>
          </Animated.View>

          {/* Exit pill */}
          <TouchableOpacity style={styles.exitPill} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.exitText}>Exit flowstate</Text>
          </TouchableOpacity>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => { setSeconds(TOTAL); setRunning(false); }}
            activeOpacity={0.75}
          >
            <Text style={styles.controlIcon}>↩</Text>
            <Text style={styles.controlLabel}>Restart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, running && styles.mainBtnPause]}
            onPress={() => setRunning((r) => !r)}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>{running ? '⏸ Pause' : '▶ Start'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => router.replace('/(app)/home' as any)}
            activeOpacity={0.75}
          >
            <Text style={styles.controlIcon}>✓</Text>
            <Text style={styles.controlLabel}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fbfaf7' },
  content: { flex: 1, paddingBottom: 90 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 60, paddingBottom: 10,
  },
  headerBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 0.5, borderColor: 'rgba(20,16,28,0.08)',
  },
  headerBtnText: { fontSize: 14, color: Colors.inkSoft },
  headerTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  orbWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  orbOuter: {
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(249,216,199,0.45)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.pinkSoft, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 60, elevation: 8,
  },
  orbInner: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(250,245,239,0.92)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.8)',
  },
  timerNumerals: { fontFamily: 'Fraunces_400Regular', fontSize: 52, fontWeight: '400', color: Colors.ink, letterSpacing: -1.5, lineHeight: 60 },
  timerCaption: { fontSize: 11, fontWeight: '600', color: Colors.inkFaint, letterSpacing: 2, marginTop: 4 },
  petImage: { width: 60, height: 60, marginTop: 8 },
  exitPill: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 0.5, borderColor: 'rgba(20,16,28,0.08)',
    shadowColor: '#3c2850', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12,
  },
  exitText: { fontSize: 13, color: Colors.inkSoft, letterSpacing: 0.3 },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 36, paddingVertical: 20,
  },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlIcon: { fontSize: 22, color: Colors.ink },
  controlLabel: { fontSize: 11, color: Colors.inkFaint, letterSpacing: 0.5 },
  mainBtn: {
    paddingHorizontal: 40, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink,
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 6,
  },
  mainBtnPause: { backgroundColor: Colors.inkSoft as any },
  mainBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
});
