/**
 * FocusScreen — Pomodoro timer (FOCO 完整版)
 * - 接收 durationMin + taskId 參數
 * - 使用擴充後的 useTimer（追蹤 pause/left_app 統計）
 * - 結束時 POST session-complete → 導向 Reward
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { Glass } from '@/components/ui/Glass';
import { TabBar } from '@/components/layout/TabBar';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { useTimer } from '@/hooks/useTimer';
import { useAuthStore } from '@/stores/authStore';
import { completeSession } from '@/services/focoService';
import { mockSessionResult } from '@/data/mockData';
import type { SessionPayload } from '@/types';

const activePet = PETS[0];

export default function FocusScreen() {
  const router = useRouter();
  const { durationMin = '25', taskId } = useLocalSearchParams<{
    durationMin?: string;
    taskId?: string;
  }>();
  const { userId } = useAuthStore();
  const durationSeconds = Number(durationMin) * 60;

  const [showQuitModal, setShowQuitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { phase, secs, paused, mm, ss, start, pause, resume, skipToReflection, getSnapshot, setTaskId } =
    useTimer({
      durationSeconds,
      onComplete: () => handleEnd(false),
    });

  // 初始化
  useEffect(() => {
    setTaskId(taskId ?? null);
    start();
  }, []);

  // Pulse orb when running
  useEffect(() => {
    if (!paused && phase === 'timer') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 2000, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [paused, phase]);

  // ── 結束計時（時間到 or 提前放棄）────────────────
  const handleEnd = async (earlyStop: boolean) => {
    if (submitting) return;
    setSubmitting(true);

    const snap = getSnapshot();
    const now = Date.now();
    const elapsed = (now - snap.startedAt) / 1000;
    const actualDuration = Math.max(
      Math.round(elapsed - snap.pauseTotalSec - snap.leftAppTotalSec),
      0,
    );
    const completed = actualDuration >= snap.plannedDuration * 0.9;

    const payload: SessionPayload = {
      user_id: userId ?? 'unknown',
      task_id: snap.taskId,
      planned_duration: snap.plannedDuration,
      actual_duration: actualDuration,
      pause_count: snap.pauseCount,
      pause_total_sec: Math.round(snap.pauseTotalSec),
      left_app_count: snap.leftAppCount,
      left_app_total_sec: Math.round(snap.leftAppTotalSec),
      completed,
      early_stop: earlyStop && !completed,
      started_at: new Date(snap.startedAt).toISOString(),
    };

    // 本地計時統計：無論後端成功或失敗都一起帶過去
    const localStats = {
      actual_duration: actualDuration,
      pause_count: snap.pauseCount,
      left_app_count: snap.leftAppCount,
    };

    try {
      const result = await completeSession(payload);
      router.replace({
        pathname: '/(app)/reward',
        params: { result: JSON.stringify({ ...result, ...localStats }) },
      });
    } catch {
      // 後端未好時，用 mock 繼續走流程
      router.replace({
        pathname: '/(app)/reward',
        params: { result: JSON.stringify({ ...mockSessionResult, ...localStats }) },
      });
    }
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {}} // 未來可連結 task
            activeOpacity={0.7}
          >
            <Text style={styles.headerBtnText}>+ Task</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flow State · {durationMin}m</Text>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowQuitModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Orb + timer */}
        <View style={styles.orbWrap}>
          <Animated.View style={[styles.orbOuter, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.orbInner}>
              <Text style={styles.timerNumerals}>{mm}:{ss}</Text>
              <Text style={styles.timerCaption}>FLOW STATE</Text>
              <Image source={activePet.image} style={styles.petImage} resizeMode="contain" />
            </View>
          </Animated.View>

          {/* Quit pill */}
          <TouchableOpacity
            style={styles.exitPill}
            onPress={() => setShowQuitModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.exitText}>Exit flowstate</Text>
          </TouchableOpacity>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setShowQuitModal(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.controlIcon}>✕</Text>
            <Text style={styles.controlLabel}>Quit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, paused && styles.mainBtnPause]}
            onPress={() => (paused ? resume() : pause())}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>{paused ? '▶ Resume' : '⏸ Pause'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => handleEnd(false)}
            activeOpacity={0.75}
          >
            <Text style={styles.controlIcon}>✓</Text>
            <Text style={styles.controlLabel}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TabBar />

      {/* 提前放棄確認 Modal */}
      <Modal visible={showQuitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>提前結束？</Text>
            <Text style={styles.modalSub}>
              放棄會影響你的 DISC 分析，但還是會獲得基礎 XP。
            </Text>
            <TouchableOpacity
              style={styles.modalQuitBtn}
              onPress={() => {
                setShowQuitModal(false);
                skipToReflection();
                handleEnd(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalQuitText}>確定放棄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalKeepBtn}
              onPress={() => setShowQuitModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalKeepText}>繼續專注</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fbfaf7' },
  content: { flex: 1, paddingBottom: 90 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 10,
  },
  headerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(20,16,28,0.08)',
  },
  headerBtnText: { fontSize: 14, color: Colors.inkSoft },
  headerTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  orbWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  orbOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(249,216,199,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.pinkSoft,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 60,
    elevation: 8,
  },
  orbInner: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(250,245,239,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  timerNumerals: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 52,
    fontWeight: '400',
    color: Colors.ink,
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  timerCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkFaint,
    letterSpacing: 2,
    marginTop: 4,
  },
  petImage: { width: 60, height: 60, marginTop: 8 },
  exitPill: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(20,16,28,0.08)',
    shadowColor: '#3c2850',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  exitText: { fontSize: 13, color: Colors.inkSoft, letterSpacing: 0.3 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingVertical: 20,
  },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlIcon: { fontSize: 22, color: Colors.ink },
  controlLabel: { fontSize: 11, color: Colors.inkFaint, letterSpacing: 0.5 },
  mainBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  mainBtnPause: { backgroundColor: Colors.inkSoft as string },
  mainBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'rgba(250,245,239,0.97)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    fontWeight: '500',
    color: Colors.ink,
    marginBottom: 10,
  },
  modalSub: {
    fontSize: 14,
    color: Colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalQuitBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: Colors.pinkHot,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalQuitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  modalKeepBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
  },
  modalKeepText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },
});
