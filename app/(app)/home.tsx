/**
 * HomeScreen — daily dashboard hub
 * - Pet carousel + inline focus setup
 * - START FOCUS → direct timer
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { CenteredPetCarousel } from '@/components/home/CenteredPetCarousel';
import {
  FocusQuickSetup,
  type FocusQuickSetupValue,
} from '@/components/home/FocusQuickSetup';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useFocusLaunch } from '@/hooks/useFocusLaunch';
import { createHomeStyles } from '@/styles/homeScreen.styles';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { getPets, getTasks } from '@/services/focoService';
import { mockPets, mockTasks } from '@/data/mockData';
import type { Task } from '@/types';

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const UNLOCKED_DEFS = PETS.filter((p) => !p.locked);

export default function HomeScreen() {
  const router = useRouter();
  const { screenBg } = useAppTheme();
  const styles = useThemedStyles(createHomeStyles);
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, restoreActivePet } = usePetStore();
  const { play } = useSound();
  const { launchFocus } = useFocusLaunch();
  const focusDurationMin = usePreferencesStore((s) => s.focusDurationMin);
  const setFocusDurationMin = usePreferencesStore((s) => s.setFocusDurationMin);
  const avatarUri = usePreferencesStore((s) => s.avatarUri);
  const hydrated = usePreferencesStore((s) => s.hydrated);

  const storePool = pets.length > 0 ? pets : mockPets;
  const modalPets = pets.length > 0 ? pets : mockPets;
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [starting, setStarting] = useState(false);

  const [setup, setSetup] = useState<FocusQuickSetupValue>({
    taskMode: 'none',
    selectedTaskId: null,
    newIconType: 'emoji',
    newIcon: '📚',
    newTitle: '',
    newMemo: '',
    selectedPetId: null,
    durationMin: 25,
  });

  useEffect(() => {
    if (!userId) return;
    getPets(userId)
      .then((fetched) => { setPets(fetched); restoreActivePet(); })
      .catch(() => setPets(mockPets));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setPendingTasks(mockTasks.tasks.filter((t) => t.status === 'pending'));
      return;
    }
    getTasks(userId)
      .then((res) => setPendingTasks(res.tasks.filter((t) => t.status === 'pending')))
      .catch(() => setPendingTasks(mockTasks.tasks.filter((t) => t.status === 'pending')));
  }, [userId]);

  useEffect(() => {
    if (hydrated) {
      setSetup((s) => ({ ...s, durationMin: focusDurationMin }));
    }
  }, [hydrated, focusDurationMin]);

  useEffect(() => {
    if (activePet?.id && !setup.selectedPetId) {
      setSetup((s) => ({ ...s, selectedPetId: activePet.id }));
    }
  }, [activePet?.id]);

  const now = new Date();
  const dateStr   = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  const hour      = now.getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = userName ?? userEmail?.split('@')[0] ?? 'there';
  const settingsAvatar = displayName[0]?.toUpperCase() ?? '?';

  const initialCarouselIndex = useMemo(() => {
    if (!activePet?.name) return 0;
    const idx = UNLOCKED_DEFS.findIndex(
      (p) => p.name.toLowerCase() === activePet.name.toLowerCase() || p.id === activePet.name.toLowerCase(),
    );
    return idx >= 0 ? idx : 0;
  }, [activePet?.name]);

  const patchSetup = (patch: Partial<FocusQuickSetupValue>) => {
    setSetup((s) => ({ ...s, ...patch }));
    if (patch.durationMin != null) {
      void setFocusDurationMin(patch.durationMin);
    }
  };

  const handleStartFocus = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await launchFocus(setup, pendingTasks);
    } finally {
      setStarting(false);
    }
  };

  const handleCarouselPet = (petId: string) => {
    const record = storePool.find(
      (p) => p.name.toLowerCase() === petId || p.id === petId,
    );
    if (record) patchSetup({ selectedPetId: record.id });
  };

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />
      <FocoBar avatar={settingsAvatar} avatarUri={avatarUri ?? undefined} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.greeting}>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.greet}>{timeGreet},{'\n'}{displayName}.</Text>
        </View>

        <View style={styles.selectorSection}>
          <View style={styles.selectorHeader}>
            <Text style={styles.selectorEyebrow}>今天的夥伴</Text>
            <TouchableOpacity
              onPress={() => { play('tap'); router.push('/(app)/pet-collection' as any); }}
              activeOpacity={0.7}
            >
              <Text style={styles.selectorAll}>全部 →</Text>
            </TouchableOpacity>
          </View>

          <CenteredPetCarousel
            pets={UNLOCKED_DEFS}
            storePool={storePool}
            initialRealIndex={initialCarouselIndex}
            onPetPress={(petId) => {
              play('transition_up');
              router.push({ pathname: '/(app)/pet-info', params: { petId } });
            }}
            onActivePetChange={handleCarouselPet}
          />
          <Text style={styles.selectorHint}>點擊查看詳情</Text>
        </View>

        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <TouchableOpacity
              style={styles.startFocusBtn}
              onPress={() => { play('tap'); handleStartFocus(); }}
              activeOpacity={0.85}
              disabled={starting}
            >
              <Text style={styles.startFocusEyebrowOnCta}>準備好了嗎？</Text>
              <Text style={styles.startFocusLabel}>
                {starting ? 'STARTING…' : 'START FOCUS →'}
              </Text>
            </TouchableOpacity>
          </FrostCard>

          <View style={styles.setupBlock}>
            <FocusQuickSetup
              pets={modalPets}
              tasks={pendingTasks}
              value={setup}
              onChange={patchSetup}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
