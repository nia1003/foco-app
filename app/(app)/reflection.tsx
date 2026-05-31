import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  GestureResponderEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { completeSession, updateTaskProgress } from '@/services/focoService';
import {
  createReflectionSliderStyles,
  createReflectionStyles,
} from '@/styles/reflectionScreen.styles';
import type { SessionPayload } from '@/types';

const waitForNextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

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
  const sliderStyles = useThemedStyles(createReflectionSliderStyles);
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
  const styles = useThemedStyles(createReflectionStyles);

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
  const submittingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setSelectedTags([]);
      setCompletionPct(initPct);
      setMoodScore(null);
      setSubmitting(false);
      submittingRef.current = false;
    }, [payloadJson, localStatsJson, initPct]),
  );

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
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    await waitForNextFrame();

    const payload: SessionPayload = {
      ...basePayload,
      distraction_reasons: selectedTags,
      completion_percent: completionPct,
      ...(moodScore !== null ? { mood_score: moodScore } : {}),
    };

    try {
      const result = await completeSession(payload);
      const oldXp = typeof localStats.old_xp === 'number' ? localStats.old_xp : null;
      if (oldXp !== null && result.new_xp <= oldXp) {
        throw new Error('Session saved, but companion XP did not increase. Please reload pets and try again.');
      }

      // Update task progress (fire-and-forget — don't block reward)
      if (basePayload.task_id) {
        updateTaskProgress(basePayload.task_id, completionPct).catch(() => {});
      }

      goToReward(JSON.stringify({ ...result, ...localStats }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(
        'Could not save session',
        message === 'Not authenticated'
          ? 'Please sign in again before saving this focus session.'
          : `${message}\n\nPlease fix the issue, then try submitting again.`,
      );
    } finally {
      submittingRef.current = false;
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
                  <Text style={[styles.moodLabel, active && styles.tagTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Actions ──────────────────────────── */}
        <TouchableOpacity
          testID="reflection-submit-button"
          style={[styles.submitBtn, submitting && { opacity: 0.55 }]}
          onPress={submit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? '送出中…' : '完成 →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.skipBtn, submitting && { opacity: 0.55 }]}
          onPress={submit}
          activeOpacity={0.6}
          disabled={submitting}
        >
          <Text style={styles.skipText}>跳過，直接看結果</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
