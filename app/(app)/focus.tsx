/**
 * FocusScreen — Pomodoro timer (FOCO 完整版)
 * - 接收 durationMin + taskId 參數
 * - 使用擴充後的 useTimer（追蹤 pause/left_app 統計）
 * - 結束時 POST session-complete → 導向 Reward
 * - 寵物直接浮在畫面中央（無圓形 orb）
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { useTimer } from '@/hooks/useTimer';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { useSound } from '@/components/SoundProvider';
import type { SessionPayload } from '@/types';

export default function FocusScreen() {
  const router = useRouter();
  const { durationMin = '25', taskId, petId: paramPetId, taskTitle } = useLocalSearchParams<{
    durationMin?: string;
    taskId?: string;
    petId?: string;
    taskTitle?: string;
  }>();
  const { userId } = useAuthStore();
  const { activePet: storePet, pets: allPets } = usePetStore();
  // Use petId from nav params (set by FocusSetupModal) — falls back to store activePet
  const resolvedPetId = paramPetId || storePet?.id || 'unknown';
  const durationSeconds = Number(durationMin) * 60;

  // Resolve pet definition for 3D render — use the param pet, not necessarily activePet
  const resolvedPetRecord = allPets.find((p) => p.id === resolvedPetId) ?? storePet;
  const activePetDef =
    (resolvedPetRecord
      ? PETS.find((p) => p.id === resolvedPetRecord.name.toLowerCase()) ??
        PETS.find((p) => p.id === 'sunion')
      : PETS.find((p) => p.id === 'sunion')) ?? PETS[0];

  const { play, playToggle } = useSound();
  const [showQuitModal, setShowQuitModal] = React.useState(false);

  // Use a ref so handleEnd always reads the latest value and stale closures can't freeze the screen
  const submittingRef = useRef(false);

  const floatAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(1)).current;

  const { phase, paused, mm, ss, start, pause, resume, skipToReflection, getSnapshot, setTaskId } =
    useTimer({
      durationSeconds,
      onComplete: () => handleEnd(false),
    });

  useEffect(() => {
    setTaskId(taskId ?? null);
    start();
  }, []);

  // Float + subtle pulse when running
  useEffect(() => {
    if (!paused && phase === 'timer') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -10, duration: 2200, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue:   0, duration: 2200, useNativeDriver: true }),
        ]),
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.04, duration: 2200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1,    duration: 2200, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      floatAnim.stopAnimation(); floatAnim.setValue(0);
      scaleAnim.stopAnimation(); scaleAnim.setValue(1);
    }
  }, [paused, phase]);

  // ── Session complete — navigate to reflection first ──
  const handleEnd = (earlyStop: boolean) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const snap = getSnapshot();
    const now = Date.now();
    const elapsed = (now - snap.startedAt) / 1000;
    const actualDuration = Math.max(
      Math.round(elapsed - snap.pauseTotalSec - snap.leftAppTotalSec),
      0,
    );
    const completed = actualDuration >= snap.plannedDuration * 0.9;
    const startedAtISO = new Date(snap.startedAt).toISOString();
    const defaultCompletion = Math.min(
      Math.round((actualDuration / Math.max(snap.plannedDuration, 1)) * 100),
      100,
    );

    const payload: SessionPayload = {
      user_id: userId ?? 'unknown',
      pet_id: resolvedPetId,
      task_id: snap.taskId,
      planned_duration: snap.plannedDuration,
      actual_duration: actualDuration,
      pause_count: snap.pauseCount,
      pause_total_sec: Math.round(snap.pauseTotalSec),
      left_app_count: snap.leftAppCount,
      left_app_total_sec: Math.round(snap.leftAppTotalSec),
      completed,
      early_stop: earlyStop && !completed,
      started_at: startedAtISO,
      events: snap.events,
    };

    const localStats = {
      actual_duration: actualDuration,
      pause_count: snap.pauseCount,
      left_app_count: snap.leftAppCount,
      started_at: startedAtISO,
      events: snap.events,
      old_xp: storePet?.xp ?? 0,
      ...(taskTitle ? { task_title: taskTitle } : {}),
    };

    submittingRef.current = false;

    // Hand off to reflection screen — it calls the API after collecting user input
    router.replace({
      pathname: '/(app)/reflection',
      params: {
        payloadJson: JSON.stringify(payload),
        localStatsJson: JSON.stringify(localStats),
        defaultCompletion: String(defaultCompletion),
      },
    });
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Flow State · {durationMin}m</Text>
          {taskTitle ? (
            <Text style={styles.taskName}>{taskTitle}</Text>
          ) : null}
        </View>

        {/* Pet + timer */}
        <View style={styles.petArea}>
          {/* Floating pet */}
          <Animated.View
            style={{
              transform: [
                { translateY: floatAnim },
                { scale: scaleAnim },
              ],
            }}
          >
            <PetRenderer pet={activePetDef} size={220} />
          </Animated.View>

          {/* Timer display */}
          <View style={styles.timerBox}>
            <Text style={styles.timerNumerals}>{mm}:{ss}</Text>
            {paused && (
              <Text style={styles.timerCaption}>PAUSED</Text>
            )}
          </View>
        </View>

        {/* Controls: Quit | Pause/Resume | Done */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => { play('tap'); setShowQuitModal(true); }}
            activeOpacity={0.75}
          >
            <Text style={styles.controlIcon}>✕</Text>
            <Text style={styles.controlLabel}>Quit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, paused && styles.mainBtnPaused]}
            onPress={() => {
              playToggle(paused); // paused→resume: toggle_on; running→pause: toggle_off
              paused ? resume() : pause();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>{paused ? '▶ Resume' : '⏸ Pause'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => { play('transition_up'); handleEnd(false); }}
            activeOpacity={0.75}
          >
            <Text style={styles.controlIcon}>✓</Text>
            <Text style={styles.controlLabel}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quit modal */}
      <Modal visible={showQuitModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => { play('tap'); setShowQuitModal(false); }}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1} onPress={() => {}}>
            <Text style={styles.modalTitle}>提前結束？</Text>
            <Text style={styles.modalSub}>
              放棄會影響你的 DISC 分析結果。
            </Text>
            <TouchableOpacity
              style={styles.modalQuitBtn}
              onPress={() => {
                play('transition_down');
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
              onPress={() => { play('tap'); setShowQuitModal(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.modalKeepText}>繼續專注</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fbfaf7' },
  content: { flex: 1, paddingBottom: 90 },

  header: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 10,
    gap: 6,
  },
  headerTitle: { fontSize: 15, fontWeight: '600', color: Colors.inkSoft },
  taskName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  // Pet area
  petArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  // Timer below pet
  timerBox: { alignItems: 'center', gap: 4 },
  timerNumerals: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 60,
    fontWeight: '400',
    color: Colors.ink,
    letterSpacing: -2,
    lineHeight: 68,
  },
  timerCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.inkFaint,
    letterSpacing: 2.5,
  },

  // Controls
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
  mainBtnPaused: { backgroundColor: Colors.inkSoft as string },
  mainBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // Quit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.80)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
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
    backgroundColor: '#F2CEDC',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalQuitText: { fontSize: 14, fontWeight: '700', color: '#b5607a' },
  modalKeepBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
  },
  modalKeepText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },
});
