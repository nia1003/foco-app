/**
 * HomeScreen — daily dashboard hub
 * - Pet carousel: tap for detail view
 * - START FOCUS button → FocusSetupModal (pick pet / duration / mission)
 */
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { FocusSetupModal } from '@/components/FocusSetupModal';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { getPets, getTasks } from '@/services/focoService';
import { mockPets, mockTasks } from '@/data/mockData';
import type { Task } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const PET_CARD_W = Math.round(SCREEN_W * 0.58);

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PINK_TEXT = '#b5607a';

// Unlocked pet definitions in display order — same list pet-collection uses
const UNLOCKED_DEFS = PETS.filter((p) => !p.locked);

export default function HomeScreen() {
  const router = useRouter();
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, setActivePet, restoreActivePet } = usePetStore();
  const { play } = useSound();

  // Pool to look up XP/level — real store data or full 4-pet mock
  const storePool = pets.length > 0 ? pets : mockPets;

  // ── Focus modal state ──────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalTasks, setModalTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!userId) return;
    getPets(userId)
      .then((fetched) => { setPets(fetched); restoreActivePet(); })
      .catch(() => setPets(mockPets));
  }, [userId]);

  // Lazily fetch pending tasks the first time the modal opens
  const openModal = async () => {
    setShowModal(true);
    if (modalTasks.length === 0) {
      try {
        const res = await getTasks(userId ?? '');
        setModalTasks(res.tasks.filter((t: Task) => t.status === 'pending'));
      } catch {
        setModalTasks(mockTasks.tasks.filter((t) => t.status === 'pending'));
      }
    }
  };

  const now = new Date();
  const dateStr   = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  const hour      = now.getHours();
  const timeGreet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = userName ?? userEmail?.split('@')[0] ?? 'there';

  const modalPets = pets.length > 0 ? pets : mockPets;

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar avatar={displayName[0]?.toUpperCase() ?? '?'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ─────────────────────────────── */}
        <View style={styles.greeting}>
          <Text style={styles.date}>{dateStr}</Text>
          <Text style={styles.greet}>{timeGreet},{'\n'}{displayName}.</Text>
        </View>

        {/* ── Pet Carousel (view only) ─────────────── */}
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petRow}
            decelerationRate="fast"
            snapToInterval={PET_CARD_W + 12}
            snapToAlignment="start"
          >
            {UNLOCKED_DEFS.map((def) => {
              const p = storePool.find((r) => r.name.toLowerCase() === def.id) ?? storePool[0];
              const xpPct = p.xp_next_level > 0 ? p.xp / p.xp_next_level : 0;

              return (
                <TouchableOpacity
                  key={def.id}
                  style={[styles.petCard, { width: PET_CARD_W }]}
                  onPress={() => { play('transition_up'); router.push({ pathname: '/(app)/pet-info', params: { petId: def.id } }); }}
                  activeOpacity={0.88}
                >
                  <View style={styles.petPreview}>
                    <PetRenderer pet={def} size={150} interactive />
                  </View>
                  <Text style={styles.petCardName}>{def.name}</Text>
                  <View style={styles.levelPill}>
                    <Text style={[styles.levelPillText, { color: def.accent }]}>Lv.{p.level}</Text>
                  </View>
                  <View style={styles.xpBarBg}>
                    <View style={[styles.xpBarFill, { width: `${Math.min(xpPct * 100, 100)}%` as any, backgroundColor: def.accent }]} />
                  </View>
                  <Text style={styles.xpText}>{p.xp} / {p.xp_next_level} XP</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.selectorHint}>點擊查看詳情</Text>
        </View>

        {/* ── START FOCUS button ───────────────────── */}
        <View style={styles.section}>
          <FrostCard radius={28} padded={false}>
            <TouchableOpacity
              style={styles.startFocusBtn}
              onPress={() => { play('tap'); openModal(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.startFocusEyebrow}>準備好了嗎？</Text>
              <Text style={styles.startFocusLabel}>START FOCUS →</Text>
            </TouchableOpacity>
          </FrostCard>
        </View>
      </ScrollView>

      {/* ── Focus Setup Modal ────────────────────────────────────── */}
      <FocusSetupModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        pets={modalPets}
        tasks={modalTasks}
        initialPetId={activePet?.id ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  greeting: { marginTop: 8, paddingHorizontal: 22, paddingBottom: 4 },
  date: { fontSize: 13, color: Colors.inkSoft },
  greet: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 32, fontWeight: '500',
    color: Colors.ink, marginTop: 4,
    letterSpacing: -0.4, lineHeight: 38,
  },

  selectorSection: { marginTop: 20 },
  selectorHeader: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 22, marginBottom: 12,
  },
  selectorEyebrow: {
    fontSize: 11, fontWeight: '700',
    color: Colors.inkFaint, letterSpacing: 1.4, textTransform: 'uppercase',
  },
  selectorAll: { fontSize: 13, fontWeight: '600', color: PINK_TEXT },
  selectorHint: {
    fontSize: 11, color: Colors.inkFaint,
    textAlign: 'center', marginTop: 10, letterSpacing: 0.3,
  },

  petRow: { paddingHorizontal: 22, gap: 12 },
  petCard: {
    borderRadius: 26, paddingHorizontal: 12,
    paddingTop: 8, paddingBottom: 12,
    alignItems: 'center', overflow: 'visible',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)',
  },
  petPreview: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 6, marginTop: 4 },
  petCardName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 17, fontWeight: '500',
    color: Colors.ink, letterSpacing: -0.2, marginBottom: 5,
  },
  levelPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, marginBottom: 10, backgroundColor: 'rgba(20,16,28,0.06)' },
  levelPillText: { fontSize: 10, fontWeight: '700' },
  xpBarBg: { width: '100%', height: 4, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)', overflow: 'hidden', marginBottom: 4 },
  xpBarFill: { height: 4, borderRadius: 9999 },
  xpText: { fontSize: 9, color: Colors.inkFaint, letterSpacing: 0.2 },

  // START FOCUS card
  section: { marginTop: 14, paddingHorizontal: 18 },
  startFocusBtn: { padding: 28, alignItems: 'center', gap: 6 },
  startFocusEyebrow: { fontSize: 11, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6 },
  startFocusLabel: { fontSize: 20, fontWeight: '700', color: Colors.ink, letterSpacing: 2 },
});
