/**
 * HomeScreen — daily dashboard hub
 * - Pet carousel: tap a card → scale-pop animation → navigate to pet-info (chat lives there)
 * - START FOCUS button → FocusSetupSheet
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { FocusSetupSheet } from '@/components/FocusSetupSheet';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { getPets, getTasks, getCalendarData } from '@/services/focoService';
import { mockPets, mockTasks, getMockCalendarData } from '@/data/mockData';
import { FocusCalendar } from '@/components/FocusCalendar';
import type { Pet as PetDef } from '@/constants/pets';
import type { Task, DayData } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const PET_CARD_W = Math.round(SCREEN_W * 0.58);

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PINK_TEXT = '#b5607a';

const UNLOCKED_DEFS = PETS.filter((p) => !p.locked);

export default function HomeScreen() {
  const router = useRouter();
  const { userId, userName, userEmail } = useAuthStore();
  const { pets, activePet, setPets, restoreActivePet, petsLastFetchedAt } = usePetStore();
  const { play } = useSound();

  const storePool = pets.length > 0 ? pets : mockPets;

  // ── Card press-scale animations ────────────────────────────────
  const cardScales = useRef<Record<string, Animated.Value>>({});
  const getScale = (id: string) => {
    if (!cardScales.current[id]) cardScales.current[id] = new Animated.Value(1);
    return cardScales.current[id];
  };

  const handlePetPress = (def: PetDef) => {
    const scale = getScale(def.id);
    play('transition_up');
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.07, useNativeDriver: true, tension: 300, friction: 8 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 8 }),
    ]).start(() => {
      router.push({ pathname: '/(app)/pet-info', params: { petId: def.id } });
    });
  };

  // ── Calendar state ─────────────────────────────────────────────
  const nowDate = new Date();
  const [calYear, setCalYear] = useState(nowDate.getFullYear());
  const [calMonth, setCalMonth] = useState(nowDate.getMonth() + 1);
  const [calData, setCalData] = useState<DayData[]>([]);

  // ── Focus modal state ──────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalTasks, setModalTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!userId) return;
    const STALE_MS = 5 * 60 * 1000;
    const isStale = !petsLastFetchedAt || Date.now() - petsLastFetchedAt > STALE_MS;
    if (pets.length && !isStale) { restoreActivePet(); return; }

    getPets(userId)
      .then((fetched) => { setPets(fetched); restoreActivePet(); })
      .catch(() => { if (!pets.length) setPets(mockPets); });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCalData(getMockCalendarData(calYear, calMonth));
      return;
    }
    getCalendarData(userId, calYear, calMonth)
      .then(setCalData)
      .catch(() => setCalData(getMockCalendarData(calYear, calMonth)));
  }, [userId, calYear, calMonth]);

  const handleMonthChange = (y: number, m: number) => {
    setCalYear(y);
    setCalMonth(m);
  };

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

        {/* ── Pet Carousel ─────────────────────────── */}
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
                <Animated.View
                  key={def.id}
                  style={{ transform: [{ scale: getScale(def.id) }] }}
                >
                  <TouchableOpacity
                    style={[styles.petCard, { width: PET_CARD_W }]}
                    onPress={() => handlePetPress(def)}
                    activeOpacity={0.92}
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
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>

          <Text style={styles.selectorHint}>點擊夥伴開始對話</Text>
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

        {/* ── Focus Calendar ───────────────────────── */}
        <View style={styles.calSection}>
          <View style={styles.calHeader}>
            <Text style={styles.calEyebrow}>FOCUS HISTORY</Text>
          </View>
          <FrostCard radius={24} padded={false}>
            <View style={styles.calInner}>
              <FocusCalendar
                year={calYear}
                month={calMonth}
                data={calData}
                onMonthChange={handleMonthChange}
              />
            </View>
          </FrostCard>
        </View>
      </ScrollView>

      {/* ── Focus Setup Sheet ────────────────────────────────────── */}
      <FocusSetupSheet
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
    paddingHorizontal: 12,
    paddingTop: 8, paddingBottom: 12,
    alignItems: 'center', overflow: 'visible',
  },
  petPreview: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 6, marginTop: 4 },
  petCardName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 17, fontWeight: '500',
    color: Colors.ink, letterSpacing: -0.2, marginBottom: 5,
  },
  levelPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, marginBottom: 10, backgroundColor: 'rgba(20,16,28,0.06)' },
  levelPillText: { fontSize: 10, fontWeight: '700' },
  xpBarBg: { width: '100%', height: 4, borderRadius: 9999, backgroundColor: 'rgba(20,16,28,0.08)', overflow: 'hidden' },
  xpBarFill: { height: 4, borderRadius: 9999 },

  section: { marginTop: 14, paddingHorizontal: 18 },

  calSection: { marginTop: 18, paddingHorizontal: 18, marginBottom: 8 },
  calHeader: { marginBottom: 10 },
  calEyebrow: {
    fontSize: 11, fontWeight: '700',
    color: Colors.inkFaint, letterSpacing: 1.4, textTransform: 'uppercase',
  },
  calInner: { padding: 16 },
  startFocusBtn: { padding: 28, alignItems: 'center', gap: 6 },
  startFocusEyebrow: { fontSize: 11, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1.6 },
  startFocusLabel: { fontSize: 20, fontWeight: '700', color: Colors.ink, letterSpacing: 2 },
});
