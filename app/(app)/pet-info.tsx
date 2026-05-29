/**
 * PetInfoScreen — 上拉式底部卡片
 * - 全螢幕顯示大寵物（無圓形框）
 * - 底部卡片：往上拉顯示 XP、個性、成長路線
 * - 底部輸入欄：直接跟寵物對話，回應以漂浮泡泡呈現
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import { mockPets } from '@/data/mockData';
import { chatWithPet } from '@/services/focoService';

const { height: SCREEN_H } = Dimensions.get('window');

// Sheet geometry
const PEEK_H   = 256;              // visible when collapsed: handle + name + trait + level/XP + button
const SHEET_H  = SCREEN_H * 0.76;
const MAX_DRAG = SHEET_H - PEEK_H;

// Auto-greeting shown when the page loads (no API call)
const PET_GREETINGS: Record<string, string> = {
  sunion: '嗨嗨！今天也要一起加油喔！☀️',
  lily:   '喲，來了啊！準備好迎接今天了嗎？',
  fluff:  '……靜靜地，陪你。',
  stay:   '專注。',
};

// Level metadata
const LEVEL_INFO: Record<number, { scale: number; label: string; desc: string }> = {
  1: { scale: 0.7,  label: '新生',   desc: '剛開始旅程，充滿好奇心！' },
  2: { scale: 0.85, label: '成長中', desc: '開始有自己的節奏，越來越有活力！' },
  3: { scale: 1.0,  label: '茁壯',   desc: '已經掌握專注的訣竅，穩健前進！' },
  4: { scale: 1.1,  label: '強壯',   desc: '令人印象深刻的專注力，繼續保持！' },
  5: { scale: 1.2,  label: '傳說',   desc: '已達到最高等級，真正的專注大師！' },
};

export default function PetInfoScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { pets, activePet } = usePetStore();
  const insets = useSafeAreaInsets();

  const searchPool = pets.length > 0 ? pets : mockPets;

  // petDef (visual definition): petId param is the PETS constant id ('sunion'/'lily')
  // — use it directly first, so collection→pet-info always shows the right 3D model + name
  const petDef =
    (petId ? PETS.find((p) => p.id === petId) : null) ??
    PETS.find((p) => p.id === (activePet?.name ?? '').toLowerCase()) ??
    PETS.find((p) => p.id === 'sunion') ??
    PETS[0];

  const pet =
    (petId ? searchPool.find((p) => p.id === petId || p.name.toLowerCase() === petId) : null) ??
    activePet ??
    mockPets[0];

  const level = Math.min(Math.max(pet.level, 1), 5) as 1 | 2 | 3 | 4 | 5;
  const info = LEVEL_INFO[level];
  const xpProgress = pet.xp_next_level > 0 ? pet.xp / pet.xp_next_level : 1;

  // ── Inline chat state ────────────────────────
  const [chatText, setChatText] = useState('');
  const [petReply, setPetReply] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const replyOpacity = useRef(new Animated.Value(0)).current;
  const lastChatAt = useRef(0);
  // Chat bar floats above the peek section; slides up when keyboard opens
  const chatBarBottom = useRef(new Animated.Value(PEEK_H + 10)).current;
  // Chat bar fades in on mount and greeting fades in shortly after
  const chatBarOpacity = useRef(new Animated.Value(0)).current;

  // On mount: fade in chat bar, then show auto-greeting
  useEffect(() => {
    Animated.timing(chatBarOpacity, { toValue: 1, duration: 350, delay: 300, useNativeDriver: true }).start();

    const greeting = PET_GREETINGS[petDef.id] ?? '嗨！';
    const timer = setTimeout(() => {
      setPetReply(greeting);
      replyOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(replyOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(9000),
        Animated.timing(replyOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]).start(() => setPetReply(''));
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const showEv = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEv = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEv, (e) => {
      Animated.timing(chatBarBottom, {
        toValue: e.endCoordinates.height + 8,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener(hideEv, (e) => {
      Animated.timing(chatBarBottom, {
        toValue: PEEK_H + 10,
        duration: Platform.OS === 'ios' ? ((e as any).duration ?? 250) : 200,
        useNativeDriver: false,
      }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const sendChat = async () => {
    const trimmed = chatText.trim();
    if (!trimmed || chatLoading) return;
    if (Date.now() - lastChatAt.current < 10_000) return;
    lastChatAt.current = Date.now();

    setChatText('');
    Keyboard.dismiss();
    setChatLoading(true);
    setPetReply('');

    try {
      const reply = await chatWithPet(petDef.id, trimmed);
      setPetReply(reply);
      replyOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(replyOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(6000),
        Animated.timing(replyOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start(() => setPetReply(''));
    } catch (e: any) {
      const errText = e?.message === 'rate_limited' ? '再等一下嘛～' : '嗯……說不出話來。';
      setPetReply(errText);
      replyOpacity.setValue(0);
      Animated.sequence([
        Animated.timing(replyOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(replyOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start(() => setPetReply(''));
    } finally {
      setChatLoading(false);
    }
  };

  // ── Bottom sheet animation ───────────────────
  const sheetY = useRef(new Animated.Value(MAX_DRAG)).current;
  const lastY  = useRef(MAX_DRAG);
  const isOpen = useRef(false);

  const springTo = (target: number) => {
    Animated.spring(sheetY, {
      toValue: target,
      useNativeDriver: true,
      tension: 72,
      friction: 12,
    }).start(() => {
      lastY.current = target;
      isOpen.current = target === 0;
    });
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderGrant: () => {
      lastY.current = (sheetY as any)._value;
    },
    onPanResponderMove: (_, g) => {
      const next = Math.max(0, Math.min(MAX_DRAG, lastY.current + g.dy));
      sheetY.setValue(next);
    },
    onPanResponderRelease: (_, g) => {
      const cur = (sheetY as any)._value;
      const shouldOpen = g.vy < -0.3 || cur < MAX_DRAG * 0.45;
      springTo(shouldOpen ? 0 : MAX_DRAG);
    },
  });

  return (
    <View style={styles.root}>
      <AppBackground />

      {/* FocoBar floats above everything */}
      <View style={styles.barWrap}>
        <FocoBar back />
      </View>

      {/* Full-screen pet — no pointerEvents block so WebView can receive touch for 3D spin */}
      <View style={[styles.petBg, { top: 56 + insets.top }]}>
        <PetRenderer pet={petDef} size={380} />
      </View>

      {/* Speech bubble — sits below the pet, tracks above the chat bar */}
      {(chatLoading || !!petReply) && (
        <Animated.View
          style={[styles.speechPosWrap, { bottom: Animated.add(chatBarBottom, 90) }]}
          pointerEvents="none"
        >
          <Animated.View
            style={[styles.speechBubbleWrap, { opacity: chatLoading ? 1 : replyOpacity }]}
          >
            {/* Tail — points UP toward the pet */}
            <View style={styles.speechTailBorder} />
            <View style={styles.speechTailFill} />
            {chatLoading ? (
              <View style={styles.speechDotsRow}>
                <Text style={styles.speechDot}>●</Text>
                <Text style={[styles.speechDot, { opacity: 0.6 }]}>●</Text>
                <Text style={[styles.speechDot, { opacity: 0.35 }]}>●</Text>
              </View>
            ) : (
              <Text style={styles.speechBubbleText}>{petReply}</Text>
            )}
          </Animated.View>
        </Animated.View>
      )}

      {/* ── Bottom Sheet ───────────────────────── */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Always-visible: name + trait + level/XP + detail button */}
        <View style={styles.peekSection}>
          <Text style={styles.petName}>{petDef.name}</Text>
          <Text style={styles.petTrait}>{petDef.trait}</Text>

          <View style={styles.peekMetaRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv.{level} · {info.label}</Text>
            </View>
            <Text style={styles.peekXP}>{pet.xp} / {pet.xp_next_level} XP</Text>
          </View>

          <View style={styles.peekXpBarBg}>
            <View style={[styles.peekXpBarFill, {
              width: `${Math.min(xpProgress * 100, 100)}%` as any,
              backgroundColor: petDef.accent,
            }]} />
          </View>

          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => springTo(0)}
            activeOpacity={0.85}
          >
            <Text style={styles.detailBtnText}>查看詳情 →</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable details */}
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* XP */}
          <FrostCard radius={24} padded={false}>
            <View style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Experience</Text>
                <Text style={styles.xpNumbers}>
                  {pet.xp}{' '}
                  <Text style={styles.xpMax}>/ {pet.xp_next_level} XP</Text>
                </Text>
              </View>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` as any }]} />
              </View>
              {level < 5 ? (
                <Text style={styles.xpHint}>再 {pet.xp_next_level - pet.xp} XP 升到 Lv.{level + 1}</Text>
              ) : (
                <Text style={styles.xpHint}>已達最高等級 🏆</Text>
              )}
            </View>
          </FrostCard>

          {/* Trait */}
          <View style={styles.section}>
            <FrostCard radius={24}>
              <Text style={styles.traitTitle}>個性</Text>
              <Text style={styles.traitValue}>{petDef.trait}</Text>
              <Text style={styles.traitDesc}>{info.desc}</Text>
            </FrostCard>
          </View>

          {/* Growth roadmap */}
          <View style={styles.section}>
            <FrostCard radius={24} padded={false}>
              <View style={styles.roadmapCard}>
                <Text style={styles.roadmapTitle}>成長路線</Text>
                {Object.entries(LEVEL_INFO).map(([lv, d]) => {
                  const lvNum = Number(lv);
                  const reached = lvNum <= level;
                  return (
                    <View key={lv} style={styles.roadmapRow}>
                      <View style={[styles.roadmapDot, reached && styles.roadmapDotActive]} />
                      <Text style={[styles.roadmapLv, reached && styles.roadmapLvActive]}>
                        Lv.{lv}
                      </Text>
                      <Text style={[styles.roadmapLabel, reached && styles.roadmapLabelActive]}>
                        {d.label}
                      </Text>
                      {lvNum === level && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>現在</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </FrostCard>
          </View>
        </ScrollView>
      </Animated.View>

      {/* ── Chat input bar — fades in on mount, floats above peek ── */}
      <Animated.View style={[styles.chatBar, { bottom: chatBarBottom }]}>
        <Animated.View style={{ opacity: chatBarOpacity }}>
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            value={chatText}
            onChangeText={setChatText}
            placeholder={`跟 ${petDef.name} 說…`}
            placeholderTextColor={Colors.inkFaint}
            returnKeyType="send"
            onSubmitEditing={sendChat}
            editable={!chatLoading}
            multiline={false}
          />
          {!!chatText.trim() && (
            <TouchableOpacity
              style={[styles.chatSendBtn, { backgroundColor: petDef.accent }, chatLoading && styles.chatSendBtnDisabled]}
              disabled={chatLoading}
              onPress={sendChat}
              activeOpacity={0.8}
            >
              <Text style={styles.chatSendIcon}>↑</Text>
            </TouchableOpacity>
          )}
        </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },

  // FocoBar floats above
  barWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 20,
  },

  // Pet fills upper area (top is set dynamically via inline style)
  petBg: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    bottom: PEEK_H,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Speech bubble (below-pet position wrapper) ──
  // Outer: absolutely positioned, tracks chatBarBottom via Animated.add
  speechPosWrap: {
    position: 'absolute',
    left: 20,
    right: 80,  // leave space on the right so it doesn't span full width
    zIndex: 24,
  },
  // Inner: white card, no absolute positioning needed
  speechBubbleWrap: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(20,16,28,0.18)',
    paddingHorizontal: 18,
    paddingTop: 20,     // extra top padding to clear the upward tail
    paddingBottom: 14,
  },
  speechBubbleText: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 15,
    color: Colors.ink,
    lineHeight: 22,
  },
  speechDotsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  speechDot: {
    fontSize: 10,
    color: Colors.inkSoft,
  },
  // Tail pointing UP — outer triangle (border colour)
  speechTailBorder: {
    position: 'absolute',
    top: -14,
    left: 28,
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: 14,
    borderBottomWidth: 14,
    borderTopWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(20,16,28,0.18)',
  },
  // Tail pointing UP — inner triangle (fill colour)
  speechTailFill: {
    position: 'absolute',
    top: -11,
    left: 29,
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: 12,
    borderBottomWidth: 12,
    borderTopWidth: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },

  // ── Sheet ─────────────────────────────────────
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#14101c',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 14,
  },
  handleArea: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(20,16,28,0.14)',
  },

  // Peek section (always visible)
  peekSection: {
    paddingHorizontal: 22,
    paddingBottom: 12,
    gap: 6,
  },
  petName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 30,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.4,
  },
  petTrait: {
    fontSize: 13,
    color: Colors.inkSoft,
    marginTop: -2,
  },
  peekMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(242,206,220,0.40)',
    borderWidth: 1,
    borderColor: 'rgba(181,96,122,0.20)',
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b5607a',
    letterSpacing: 0.3,
  },
  peekXP: {
    fontSize: 12,
    color: Colors.inkSoft,
    fontWeight: '500',
  },
  peekXpBarBg: {
    height: 5,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    overflow: 'hidden',
    marginTop: 2,
  },
  peekXpBarFill: {
    height: 5,
    borderRadius: 9999,
  },
  detailBtn: {
    marginTop: 6,
    backgroundColor: Colors.ink,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Scrollable detail content
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingHorizontal: 18, paddingBottom: 40 },
  section: { marginTop: 12 },

  // XP card
  xpCard: { padding: 20 },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  xpLabel: { fontSize: 12, fontWeight: '700', color: Colors.inkFaint, letterSpacing: 1 },
  xpNumbers: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 22,
    fontWeight: '500',
    color: Colors.ink,
  },
  xpMax: { fontSize: 14, fontWeight: '400', color: Colors.inkSoft },
  xpBarBg: {
    height: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: '#F2CEDC',
  },
  xpHint: { fontSize: 11, color: Colors.inkFaint, marginTop: 8, textAlign: 'right' },

  // Trait
  traitTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  traitValue: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 20,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  traitDesc: { fontSize: 13, color: Colors.inkSoft, marginTop: 6, lineHeight: 19 },

  // Roadmap
  roadmapCard: { padding: 20 },
  roadmapTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  roadmapRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  roadmapDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(20,16,28,0.12)',
  },
  roadmapDotActive: { backgroundColor: '#F2CEDC' },
  roadmapLv: { fontSize: 12, color: Colors.inkFaint, width: 36 },
  roadmapLvActive: { color: Colors.ink, fontWeight: '700' },
  roadmapLabel: { flex: 1, fontSize: 13, color: Colors.inkFaint },
  roadmapLabelActive: { color: Colors.ink },
  currentBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(242,206,220,0.50)',
  },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: '#b5607a' },

  // ── Chat input bar ────────────────────────────
  chatBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 25,
    elevation: 16,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(20,16,28,0.18)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.ink,
    paddingVertical: 0,
  },
  chatSendBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  chatSendBtnDisabled: { opacity: 0.35 },
  chatSendIcon: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
