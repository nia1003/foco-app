/**
 * FocusTypeScreen — Register Step 4: Select focus identity
 * 新建帳號-專注類型頁，選擇後直接進入 Home
 */
import React, { useState } from 'react';
import {
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
import { Colors } from '@/constants/theme';

const FOCUS_TYPES = [
  { id: 'student', emoji: '🎓', title: '學生 / 備考族', sub: 'Study & Exams' },
  { id: 'work', emoji: '💼', title: '上班族 / 職場工作者', sub: 'Work & Career' },
  { id: 'creative', emoji: '🎨', title: '創作者 / 自由工作者', sub: 'Creative & Freelance' },
  { id: 'growth', emoji: '🌱', title: '個人成長 / 習慣養成', sub: 'Self-Improvement' },
] as const;

type FocusTypeId = (typeof FOCUS_TYPES)[number]['id'];

export default function FocusTypeScreen() {
  const router = useRouter();
  const { play } = useSound();
  const [selected, setSelected] = useState<FocusTypeId | null>(null);

  const handleSelect = (id: FocusTypeId) => {
    play('tap');
    setSelected(id);
  };

  const handleContinue = () => {
    if (!selected) return;
    play('transition_up');
    router.push('/(auth)/done');
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <View style={styles.content}>
        <FocoBar back />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <FrostCard radius={32}>
            <Text style={styles.heading}>你的專注風格？</Text>
            <Text style={styles.sub}>幫助我們為你個人化體驗</Text>

            <View style={styles.tiles}>
              {FOCUS_TYPES.map((item) => {
                const active = selected === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.tile, active && styles.tileActive]}
                    onPress={() => handleSelect(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tileEmoji}>{item.emoji}</Text>
                    <View style={styles.tileText}>
                      <Text style={[styles.tileTitle, active && styles.tileTitleActive]}>
                        {item.title}
                      </Text>
                      <Text style={styles.tileSub}>{item.sub}</Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, !selected && styles.disabled]}
              onPress={handleContinue}
              disabled={!selected}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>下一步 →</Text>
            </TouchableOpacity>
          </FrostCard>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 54 },
  scrollContent: { paddingBottom: 40 },
  heading: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 26, fontWeight: '500', color: Colors.ink, letterSpacing: -0.3,
  },
  sub: { fontSize: 14, color: Colors.inkSoft, marginTop: 6, marginBottom: 24 },
  tiles: { gap: 12 },
  tile: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16, borderWidth: 1.5,
    borderColor: 'rgba(20,16,28,0.12)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tileActive: {
    borderColor: Colors.ink,
    backgroundColor: 'rgba(20,16,28,0.05)',
  },
  tileEmoji: { fontSize: 26, marginRight: 14 },
  tileText: { flex: 1 },
  tileTitle: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  tileTitleActive: { color: Colors.ink },
  tileSub: { fontSize: 12, color: Colors.inkFaint, marginTop: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(20,16,28,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.ink },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.ink,
  },
  continueBtn: {
    marginTop: 28, paddingVertical: 16, borderRadius: 9999,
    backgroundColor: Colors.ink, alignItems: 'center',
    shadowColor: Colors.ink, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 6,
  },
  continueBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 3 },
  disabled: { opacity: 0.4 },
});
