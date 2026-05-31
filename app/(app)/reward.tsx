import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import type { SessionResult } from '@/types';

export default function RewardScreen() {
  const router = useRouter();
  const { result: resultStr } = useLocalSearchParams<{ result: string }>();
  const result: SessionResult & { static_pet_id?: string } = resultStr ? JSON.parse(resultStr) : {};
  
  const { applySessionResult, pets: allPets } = usePetStore();
  const { play } = useSound();

  const [showEvolutionModal, setShowEvolutionModal] = useState(false);

  const resolvedId = result.static_pet_id || result.pet_id || 'sunion';
  const dbRecord = allPets.find(p => p.id === resolvedId);
  const targetName = dbRecord ? dbRecord.name.toLowerCase() : resolvedId.toLowerCase();

  const petDef = PETS.find(p =>
    p.id.toLowerCase() === targetName || p.name.toLowerCase() === targetName
  ) ?? PETS.find(p => p.id === 'sunion') ?? PETS[0];
  
  const accent = petDef.accent ?? Colors.pinkText;

  const oldXpFraction = result.xp_next_level
    ? (result.old_xp ?? 0) / result.xp_next_level
    : 0;
  const newXpFraction = result.xp_next_level
    ? Math.min(result.new_xp / result.xp_next_level, 1)
    : 0;

  const xpBarAnim    = useRef(new Animated.Value(oldXpFraction)).current;
  const levelUpAnim  = useRef(new Animated.Value(0)).current;
  const contentAnim  = useRef(new Animated.Value(0)).current;
  const petScaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (result.pet_id && result.new_xp !== undefined) {
      applySessionResult(result.pet_id, result.new_xp, result.new_level, result.xp_next_level);
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(contentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(petScaleAnim, { toValue: 1.1, tension: 60, friction: 7, useNativeDriver: true }),
      ]),
      Animated.timing(xpBarAnim, { toValue: newXpFraction, duration: 1000, useNativeDriver: false }),
    ]).start(() => {
      if (result.level_up) {
        play('transition_up');
        Animated.spring(levelUpAnim, {
          toValue: 1, tension: 40, friction: 5, useNativeDriver: true,
        }).start();
      }
    });

    if (result.level_up && result.new_level >= 5) {
      const timer = setTimeout(() => {
        play('transition_up');
        setShowEvolutionModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const xpBarWidth = xpBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      <AppBackground />

      <Animated.View style={[styles.content, { opacity: contentAnim }]}>
        <Animated.View
          style={{
            transform: [
              { translateY: floatAnim },
              { scale: petScaleAnim },
            ],
          }}
        >
          {/* 使用安全的畫布大小 300，但將 3D 模型放大 1.4 倍 */}
          <PetRenderer 
            pet={petDef} 
            size={300} 
            interactive={false} 
            level={result.new_level} 
            scaleMultiplier={1.4} 
          />
        </Animated.View>

        <View style={styles.progressSection}>
          <View style={styles.levelRow}>
            <Text style={[styles.levelLabel, { color: accent }]}>Lv.{result.new_level}</Text>
            {result.level_up && (
              <Animated.View
                style={[
                  styles.levelUpBadge,
                  {
                    opacity: levelUpAnim,
                    transform: [
                      { scale: levelUpAnim },
                      {
                        translateY: levelUpAnim.interpolate({
                          inputRange: [0, 1], outputRange: [10, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.levelUpText}>Level Up!</Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.xpBarBg}>
            <Animated.View
              style={[styles.xpBarFill, { width: xpBarWidth, backgroundColor: accent }]}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              play('transition_up');
              router.push({ pathname: '/(app)/analysis', params: { result: resultStr } });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>查看報告 →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => { play('transition_down'); router.replace('/(app)/home'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostBtnText}>回首頁</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Modal visible={showEvolutionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.evoModalCard, { borderColor: accent }]}>
            <Text style={styles.evoModalTitle}>恭喜解鎖</Text>
            <Text style={styles.evoModalSub}>
              你的 {petDef.name} 達到了滿等狀態，解鎖了最終進化型態！感謝你一路以來的專注與陪伴。
            </Text>
            <TouchableOpacity
              style={[styles.evoModalBtn, { backgroundColor: accent }]}
              onPress={() => {
                play('tap');
                setShowEvolutionModal(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.evoModalBtnText}>太棒了！</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 0,
  },
  progressSection: { width: '100%', marginTop: 24, gap: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  levelLabel: { fontFamily: 'Fraunces_500Medium', fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  levelUpBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9999, backgroundColor: 'rgba(242,206,220,0.50)', borderWidth: 1, borderColor: 'rgba(181,96,122,0.30)' },
  levelUpText: { fontSize: 14, fontWeight: '700', color: Colors.pinkText },
  xpBarBg: { height: 10, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)', overflow: 'hidden', width: '100%' },
  xpBarFill: { height: '100%', borderRadius: 9999 },
  actions: { width: '100%', gap: 10, marginTop: 36 },
  primaryBtn: { paddingVertical: 16, borderRadius: 9999, backgroundColor: Colors.ink, alignItems: 'center', shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 6 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  ghostBtn: { paddingVertical: 14, alignItems: 'center' },
  ghostBtnText: { fontSize: 14, color: Colors.inkSoft },
  
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(255,255,255,0.7)' },
  evoModalCard: { width: '100%', borderRadius: 28, padding: 28, alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 20 },
  evoModalTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 24, fontWeight: '700', color: Colors.ink, marginBottom: 12 },
  evoModalSub: { fontSize: 15, color: Colors.inkSoft, textAlign: 'center', lineHeight: 24, marginBottom: 28, paddingHorizontal: 10 },
  evoModalBtn: { width: '100%', paddingVertical: 16, borderRadius: 9999, alignItems: 'center' },
  evoModalBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});