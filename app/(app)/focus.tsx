import React, { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FocoBar } from '@/components/layout/FocoBar';
import { WavyTimer } from '@/components/ui/WavyTimer';
import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PETS } from '@/constants/pets';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { useTimer } from '@/hooks/useTimer';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { useSound } from '@/components/SoundProvider';
import type { SessionPayload } from '@/types';

export default function FocusScreen() {
  const router = useRouter();
  const {
    durationMin = '25',
    taskId,
    petId: paramPetId,
    taskTitle,
  } = useLocalSearchParams<{
    durationMin?: string;
    taskId?: string;
    petId?: string;
    taskTitle?: string;
  }>();
  const { userId } = useAuthStore();
  const { pets: allPets, activePet: storePet } = usePetStore();

  const resolvedTaskId = taskId?.trim() ? taskId : null;
  const durationSeconds = Number(durationMin) * 60;

  const staticPetId = paramPetId || 'sunion';
  const activePetDef = PETS.find((p) => p.id === staticPetId) ?? PETS.find((p) => p.id === 'sunion') ?? PETS[0];

  const resolvedPetRecord = allPets.find((p) =>
    p.name?.toLowerCase() === activePetDef.name.toLowerCase() ||
    p.name?.toLowerCase() === activePetDef.id.toLowerCase()
  );

  // 如果找不到合法 UUID，拿第一隻合法的 UUID 來擋，避免報錯。
  // 但是 static_pet_id 依然會傳遞給下一頁
  const dbPetId = resolvedPetRecord?.id ?? allPets[0]?.id ?? 'unknown';

  const { play, playToggle } = useSound();
  const { surfaces } = useAppTheme();
  const [showQuitModal, setShowQuitModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const submittingRef = useRef(false);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const {
    phase,
    paused,
    mm,
    ss,
    progress,
    start,
    pause,
    resume,
    skipToReflection,
    reset,
    getSnapshot,
    setTaskId,
  } = useTimer({
    durationSeconds,
    onComplete: () => handleEnd(false),
  });

  const elapsedProgress = 1 - progress;

  useFocusEffect(
    useCallback(() => {
      setTaskId(resolvedTaskId);
      start();
      return () => {
        reset();
      };
    }, [durationSeconds, resolvedTaskId]),
  );

  useEffect(() => {
    if (!paused && phase === 'timer') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -10, duration: 2200, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
        ]),
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.04, duration: 2200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      floatAnim.stopAnimation();
      floatAnim.setValue(0);
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);
    }
  }, [paused, phase]);

  const handleEnd = async (earlyStop: boolean) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const snap = getSnapshot();
    const now = Date.now();
    const elapsed = (now - snap.startedAt) / 1000;
    const actualDuration = Math.max(Math.round(elapsed - snap.pauseTotalSec - snap.leftAppTotalSec), 0);
    const completed = actualDuration >= snap.plannedDuration * 0.9;
    const startedAtISO = new Date(snap.startedAt).toISOString();

    const payload: SessionPayload = {
      user_id: userId ?? 'unknown',
      pet_id: dbPetId, 
      task_id: snap.taskId?.trim() ? snap.taskId : null,
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
      old_xp: resolvedPetRecord?.xp ?? storePet?.xp ?? 0,
      pet_id: dbPetId, 
      static_pet_id: activePetDef.id, 
      ...(taskTitle ? { task_title: taskTitle } : {}),
    };

    const durationRatio = snap.plannedDuration > 0 ? Math.min(actualDuration / snap.plannedDuration, 1) : 1;
    const defaultCompletion = earlyStop ? Math.round(durationRatio * 100) : 100;

    router.replace({
      pathname: '/(app)/reflection',
      params: {
        payloadJson: JSON.stringify(payload),
        localStatsJson: JSON.stringify(localStats),
        defaultCompletion: String(defaultCompletion),
      },
    });

    submittingRef.current = false;
    setSubmitting(false);
  };

  return (
    <View style={styles.root}>
      <FocoBar />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Flow State · {durationMin}m</Text>
          {taskTitle ? <Text style={styles.taskName}>{taskTitle}</Text> : null}
        </View>

        <View style={styles.petArea}>
          <WavyTimer progress={elapsedProgress} timeLabel={`${mm}:${ss}`} caption={paused ? 'PAUSED' : undefined} size={320}>
            <Animated.View style={{ transform: [{ translateY: floatAnim }, { scale: scaleAnim }] }}>
              <PetRenderer key={activePetDef.id} pet={activePetDef} size={160} force2D={true} />
            </Animated.View>
          </WavyTimer>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlBtn, submitting && styles.controlBtnDisabled]} onPress={() => { play('tap'); setShowQuitModal(true); }} disabled={submitting} activeOpacity={0.75}>
            <Text style={styles.controlIcon}>✕</Text>
            <Text style={styles.controlLabel}>Quit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.mainBtn, { backgroundColor: surfaces.ctaBg, shadowColor: surfaces.shadowColor }, paused && { opacity: 0.9 }, submitting && { opacity: 0.65 }]} onPress={() => { playToggle(paused); paused ? resume() : pause(); }} disabled={submitting} activeOpacity={0.85}>
            <Text style={[styles.mainBtnText, { color: surfaces.ctaText }]}>{paused ? '▶ Resume' : '⏸ Pause'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlBtn, submitting && styles.controlBtnDisabled]} onPress={() => { play('transition_up'); handleEnd(false); }} disabled={submitting} activeOpacity={0.75}>
            <Text style={styles.controlIcon}>✓</Text>
            <Text style={styles.controlLabel}>Done</Text>
          </TouchableOpacity>
        </View>
        {submitting ? <Text style={styles.savingText}>Saving session...</Text> : null}
      </View>

      <Modal visible={showQuitModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: surfaces.modalBackdrop }]}>
          <View style={[styles.modalCard, { backgroundColor: surfaces.modalSheetBg, borderColor: surfaces.dividerStrong }]}>
            <Text style={styles.modalTitle}>提前結束？</Text>
            <Text style={styles.modalSub}>放棄會影響你的 DISC 分析結果。</Text>
            <TouchableOpacity style={styles.modalQuitBtn} onPress={() => { play('transition_down'); setShowQuitModal(false); skipToReflection(); handleEnd(true); }} activeOpacity={0.85}>
              <Text style={styles.modalQuitText}>確定放棄</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalKeepBtn} onPress={() => { play('tap'); setShowQuitModal(false); }} activeOpacity={0.7}>
              <Text style={styles.modalKeepText}>繼續專注</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, paddingBottom: 90 },
  header: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10, gap: 6 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: Colors.inkSoft },
  taskName: { fontFamily: 'Fraunces_500Medium', fontSize: 28, fontWeight: '500', color: Colors.ink, letterSpacing: -0.5, textAlign: 'center' },
  petArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36, paddingVertical: 20 },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlBtnDisabled: { opacity: 0.45 },
  controlIcon: { fontSize: 22, color: Colors.ink },
  controlLabel: { fontSize: 11, color: Colors.inkFaint, letterSpacing: 0.5 },
  savingText: { marginTop: -10, textAlign: 'center', fontSize: 12, fontWeight: '600', color: Colors.inkFaint },
  mainBtn: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 9999, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 6 },
  mainBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 28, padding: 28, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12, overflow: 'hidden' },
  modalTitle: { fontFamily: 'Fraunces_500Medium', fontSize: 22, fontWeight: '500', color: Colors.ink, marginBottom: 10 },
  modalSub: { fontSize: 14, color: Colors.inkSoft, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalQuitBtn: { width: '100%', paddingVertical: 14, borderRadius: 9999, backgroundColor: 'rgba(236,197,254,0.40)', alignItems: 'center', marginBottom: 10 },
  modalQuitText: { fontSize: 14, fontWeight: '700', color: '#7B5EA7' },
  modalKeepBtn: { width: '100%', paddingVertical: 14, borderRadius: 9999, alignItems: 'center' },
  modalKeepText: { fontSize: 14, fontWeight: '600', color: Colors.inkSoft },
});