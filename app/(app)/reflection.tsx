/**
 * ReflectionScreen — 微反思結算（專注結束後自動進入）
 * 三個快問題：分心標籤 + 完成度 + 心情
 * 提交後呼叫 completeSession + updateTaskProgress → reward
 */
import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { Colors } from '@/constants/theme';
import { usePetStore } from '@/stores/petStore';
import { completeSession, updateTaskProgress } from '@/services/focoService';
import { mockSessionResult } from '@/data/mockData';
import type { SessionPayload } from '@/types';

const PINK     = Colors.pinkText;
const PINK_BG  = '#F2CEDC';

// ── Distraction tag definitions ───────────────
const DISTRACTION_TAGS = [
  { id: 'phone',   label: '手機通知' },
  { id: 'social',  label: '社群媒體' },
  { id: 'noise',   label: '環境噪音' },
  { id: 'thought', label: '突然想到其他事' },
  { id: 'rest',    label: '需要休息' },
  { id: 'people',  label: '旁人打擾' },
  { id: 'other',   label: '其他' },
];

// ── Mood options ──────────────────────────────
const MOODS = [
  { score: 1, emoji: '😫', label: '很糟' },
  { score: 2, emoji: '😕', label: '不好' },
  { score: 3, emoji: '😐', label: '普通' },
  { score: 4, emoji: '🙂', label: '不錯' },
  { score: 5, emoji: '😊', label: '很棒' },
];

// ── Inline completion slider (0–100 %, step 5) ─
function CompletionSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackPageXRef = useRef(0);

  const progress = value / 100;
  const thumbLeft = trackWidth > 0 ? progress * (trackWidth - 26) : 0;

  const measure = () => {
    trackRef.current?.measure((_fx, _fy, w, _h, pageX) => {
      trackPageXRef.current = pageX;
      if (w > 0) setTrackWidth(w);
    });
  };

  const handleTouch = (pageX: number) => {
    if (trackWidth === 0) return;
    const local = pageX - trackPageXRef.current;
    const ratio = Math.max(0, Math.min(1, local / trackWidth));
    onChange(Math.round(ratio * 20) * 5); // snap to multiples of 5
  };

  return (
    <View style={sliderStyles.wrap}>
      <View style={sliderStyles.valueRow}>
        <Text style={sliderStyles.valueText}>{value}%</Text>
        <Text style={sliderStyles.valueHint}>
          {value === 0 ? '沒什麼進展' : value < 50 ? '才剛開始' : value < 100 ? '進行中' : '全部完成！🎉'}
        </Text>
      </View>
      <View
        ref={trackRef}
        style={sliderStyles.track}
        onLayout={measure}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e: GestureResponderEvent) => { measure(); handleTouch(e.nativeEvent.pageX); }}
        onResponderMove={(e: GestureResponderEvent) => handleTouch(e.nativeEvent.pageX)}
      >
        <View style={[sliderStyles.fill, { width: `${progress * 100}%` as any }]} />
        <View style={[sliderStyles.thumb, { left: thumbLeft }]} />
      </View>
      <View style={sliderStyles.endLabels}>
        <Text style={sliderStyles.endLabel}>0%</Text>
        <Text style={sliderStyles.endLabel}>100%</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────
export default function ReflectionScreen() {
  const router = useRouter();
  const { pets: allPets } = usePetStore();

  const { payloadJson, localStatsJson, defaultCompletion } =
    useLocalSearchParams<{
      payloadJson: string;
      localStatsJson: string;
      defaultCompletion: string;
    }>();

  const basePayload: SessionPayload = payloadJson ? JSON.parse(payloadJson) : ({} as SessionPayload);
  const localStats = localStatsJson ? JSON.parse(localStatsJson) : {};
  const initPct = Math.max(0, Math.min(100, Math.round((Number(defaultCompletion ?? 100)) / 5) * 5));

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [completionPct, setCompletionPct] = useState(initPct);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (id: string) =>
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );

  const goToReward = (resultJson: string) => {
    router.replace({
      pathname: '/(app)/reward',
      params: { result: resultJson },
    });
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const payload: SessionPayload = {
      ...basePayload,
      distraction_reasons: selectedTags,
      completion_percent: completionPct,
      ...(moodScore !== null ? { mood_score: moodScore } : {}),
    };

    try {
      const result = await completeSession(payload);

      // Update task progress (fire-and-forget — don't block reward)
      if (basePayload.task_id) {
        updateTaskProgress(basePayload.task_id, completionPct).catch(() => {});
      }

      goToReward(JSON.stringify({ ...result, ...localStats }));
    } catch {
      goToReward(JSON.stringify({ ...mockSessionResult, ...localStats }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Heading ───────────────────────────── */}
        <View style={styles.headingBlock}>
          <Text style={styles.heading}>這次怎麼樣？</Text>
          <Text style={styles.sub}>快速記錄一下，幫你建立專注洞察</Text>
        </View>

        {/* ── Q1: Distraction tags ──────────────── */}
        <View style={styles.section}>
          <Text style={styles.qLabel}>有什麼讓你分心了嗎？</Text>
          <Text style={styles.qHint}>可多選，完全專注就跳過</Text>
          <View style={styles.tagGrid}>
            {DISTRACTION_TAGS.map((tag) => {
              const active = selectedTags.includes(tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => toggleTag(tag.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Q2: Completion slider ─────────────── */}
        <View style={styles.section}>
          <Text style={styles.qLabel}>這次完成了多少？</Text>
          <CompletionSlider value={completionPct} onChange={setCompletionPct} />
        </View>

        {/* ── Q3: Mood ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.qLabel}>整體感受如何？</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const active = moodScore === m.score;
              return (
                <TouchableOpacity
                  key={m.score}
                  style={[styles.moodBtn, active && styles.moodBtnActive]}
                  onPress={() => setMoodScore(m.score)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, active && { color: PINK, fontWeight: '700' }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Actions ──────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.55 }]}
          onPress={submit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? '送出中…' : '完成 →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={submit} activeOpacity={0.6}>
          <Text style={styles.skipText}>跳過，直接看結果</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Slider styles ─────────────────────────────
const sliderStyles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 4 },
  valueRow: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginBottom: 12,
  },
  valueText: { fontSize: 26, fontWeight: '700', color: PINK, letterSpacing: -0.5 },
  valueHint: { fontSize: 12, color: Colors.inkFaint },
  track: {
    height: 6, borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.08)',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute', left: 0,
    height: 6, borderRadius: 9999,
    backgroundColor: PINK_BG,
  },
  thumb: {
    position: 'absolute',
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff',
    borderWidth: 2.5, borderColor: PINK,
    top: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
  },
  endLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 10,
  },
  endLabel: { fontSize: 10, color: Colors.inkFaint },
});

// ── Screen styles ─────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fbfaf7' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 60 },

  headingBlock: { marginBottom: 36 },
  heading: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 34, fontWeight: '500',
    color: Colors.ink, letterSpacing: -0.6,
    marginBottom: 6,
  },
  sub: { fontSize: 14, color: Colors.inkSoft, lineHeight: 20 },

  section: {
    marginBottom: 36,
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    padding: 20,
  },
  qLabel: { fontSize: 15, fontWeight: '700', color: Colors.ink, marginBottom: 4 },
  qHint: { fontSize: 12, color: Colors.inkFaint, marginBottom: 14 },

  // Distraction tags
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: 'rgba(20,16,28,0.05)',
    borderWidth: 1, borderColor: 'transparent',
  },
  tagActive: { backgroundColor: PINK_BG, borderColor: PINK },
  tagText: { fontSize: 13, fontWeight: '500', color: Colors.inkSoft },
  tagTextActive: { color: PINK, fontWeight: '700' },

  // Mood
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  moodBtn: {
    alignItems: 'center', gap: 4,
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
  },
  moodBtnActive: { backgroundColor: PINK_BG },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 10, color: Colors.inkFaint, letterSpacing: 0.2 },

  // Actions
  submitBtn: {
    paddingVertical: 17,
    borderRadius: 9999,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 12,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipText: { fontSize: 13, color: Colors.inkFaint },
});
