/**
 * FocusSetupModal — shared bottom-sheet for starting a focus session.
 * Used by HomeScreen (no pre-selected task) and MissionsScreen (task pre-selected).
 */
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FrostCard } from '@/components/ui/FrostCard';
import { DurationSlider } from '@/components/ui/DurationSlider';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import { useSound } from '@/components/SoundProvider';
import type { FocoPet, Task } from '@/types';

const PINK      = '#F2CEDC';
const PINK_TEXT = '#b5607a';

interface Props {
  visible: boolean;
  onClose: () => void;
  pets: FocoPet[];
  tasks: Task[];
  initialPetId?: string | null;
  initialDuration?: number;
  initialTaskId?: string | null;
}

export function FocusSetupModal({
  visible,
  onClose,
  pets,
  tasks,
  initialPetId,
  initialDuration = 25,
  initialTaskId = null,
}: Props) {
  const router = useRouter();
  const { activePet, setActivePet } = usePetStore();
  const { play } = useSound();

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId);

  // Reset state each time the modal opens
  useEffect(() => {
    if (visible) {
      setSelectedPetId(initialPetId ?? activePet?.id ?? pets[0]?.id ?? null);
      setSelectedDuration(initialDuration);
      setSelectedTaskId(initialTaskId);
    }
  }, [visible]);

  const handleStart = async () => {
    if (selectedPetId && selectedPetId !== activePet?.id) {
      await setActivePet(selectedPetId);
    }
    onClose();
    play('transition_up');
    router.push({
      pathname: '/(app)/focus',
      params: {
        durationMin: String(selectedDuration),
        ...(selectedTaskId ? { taskId: selectedTaskId } : {}),
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <FrostCard radius={28}>
            <Text style={styles.title}>Start a Focus Session</Text>

            {/* ── COMPANION ── */}
            <Text style={styles.label}>COMPANION</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petChipRow}
            >
              {pets.map((p) => {
                const def = PETS.find((d) => d.id === p.name.toLowerCase()) ?? PETS[0];
                const active = selectedPetId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.petChip,
                      active && { borderColor: def.accent, backgroundColor: 'rgba(255,255,255,0.80)' },
                    ]}
                    onPress={() => { play('tap'); setSelectedPetId(p.id); }}
                    activeOpacity={0.8}
                  >
                    <PetRenderer pet={def} size={52} interactive={false} />
                    <Text style={[styles.petChipName, active && { color: def.accent, fontWeight: '700' }]}>
                      {def.name}
                    </Text>
                    {active && <View style={[styles.petChipDot, { backgroundColor: def.accent }]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── DURATION ── */}
            <Text style={[styles.label, { marginTop: 20 }]}>DURATION</Text>
            <View style={{ marginTop: 4 }}>
              <DurationSlider value={selectedDuration} onChange={setSelectedDuration} />
            </View>

            {/* ── MISSION ── */}
            <Text style={styles.label}>
              MISSION <Text style={styles.optionalTag}>(optional)</Text>
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.taskChipRow}
            >
              <TouchableOpacity
                style={[styles.taskChip, !selectedTaskId && styles.taskChipActive]}
                onPress={() => { play('tap'); setSelectedTaskId(null); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.taskChipText, !selectedTaskId && styles.taskChipTextActive]}>
                  No mission
                </Text>
              </TouchableOpacity>

              {tasks.map((t) => {
                const active = selectedTaskId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.taskChip, active && styles.taskChipActive]}
                    onPress={() => { play('tap'); setSelectedTaskId(t.id); }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[styles.taskChipText, active && styles.taskChipTextActive]}
                      numberOfLines={1}
                    >
                      {t.emoji ? `${t.emoji} ` : ''}{t.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── START ── */}
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
              <Text style={styles.startText}>START FOCUS →</Text>
            </TouchableOpacity>
          </FrostCard>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 16 },

  title: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22, fontWeight: '500',
    color: Colors.ink, marginBottom: 20,
  },
  label: {
    fontSize: 11, fontWeight: '700',
    color: Colors.inkFaint, letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 10,
  },
  optionalTag: { fontSize: 10, fontWeight: '400', color: Colors.inkFaint, textTransform: 'none' },

  // Pet chips
  petChipRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  petChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent',
    backgroundColor: 'rgba(20,16,28,0.04)', gap: 4, minWidth: 76, position: 'relative',
  },
  petChipName: { fontSize: 11, color: Colors.inkSoft, letterSpacing: 0.2 },
  petChipDot: { position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3 },

  // Task chips
  taskChipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  taskChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.05)',
    borderWidth: 1, borderColor: 'transparent',
  },
  taskChipActive: { backgroundColor: PINK, borderColor: PINK_TEXT },
  taskChipText: { fontSize: 13, fontWeight: '500', color: Colors.inkSoft, maxWidth: 200 },
  taskChipTextActive: { color: PINK_TEXT, fontWeight: '600' },

  // Start button
  startBtn: {
    marginTop: 24, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  startText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2.5 },
});
