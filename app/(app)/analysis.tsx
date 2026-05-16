/**
 * AnalysisScreen — DISC 專注報告
 * 顯示：實際時長、暫停次數、切出次數、DISC 類型、XP 明細
 * 功能：截圖分享 / 儲存到相簿 / 回首頁
 */
import React, { useRef } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';
import type { SessionResult } from '@/types';

// ── DISC 對照表 ───────────────────────────────
const DISC_INFO = {
  conscientiousness: {
    emoji: '🔵',
    label: 'Conscientiousness 謹慎型',
    desc: '精準、有條理，完美執行！每個細節都在掌控之中。',
  },
  dominance: {
    emoji: '🔴',
    label: 'Dominance 主導型',
    desc: '目標導向、高完成率，勇往直前！完成就是你的動力。',
  },
  steadiness: {
    emoji: '🟢',
    label: 'Steadiness 穩健型',
    desc: '節奏穩定、踏實推進，細水長流！持續是你的超能力。',
  },
  influence: {
    emoji: '🟡',
    label: 'Influence 影響型',
    desc: '彈性十足、靈活應變，熱情滿滿！嘗試更長的專注時段吧。',
  },
} as const;

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} 分 ${s} 秒`;
}

export default function AnalysisScreen() {
  const router = useRouter();
  const { result: resultStr } = useLocalSearchParams<{ result: string }>();
  const result: SessionResult = resultStr ? JSON.parse(resultStr) : {};

  const discKey = result.focus_type ?? 'steadiness';
  const disc = DISC_INFO[discKey as keyof typeof DISC_INFO] ?? DISC_INFO.steadiness;

  // XP 明細說明
  const xpDetails = buildXPDetails(result);

  // ── 分享 / 儲存（需要 react-native-view-shot + expo-sharing/media-library）
  // 若套件尚未安裝，這段 import 會 fail → 先用 Alert placeholder
  const handleShare = async () => {
    try {
      const ViewShot = (await import('react-native-view-shot')).default;
      const Sharing = await import('expo-sharing');
      Alert.alert('分享', '此功能需要安裝 react-native-view-shot 和 expo-sharing。');
    } catch {
      Alert.alert('提示', '請先執行：npx expo install react-native-view-shot expo-sharing');
    }
  };

  const handleSave = async () => {
    try {
      const MediaLibrary = await import('expo-media-library');
      Alert.alert('儲存', '此功能需要安裝 expo-media-library。');
    } catch {
      Alert.alert('提示', '請先執行：npx expo install expo-media-library');
    }
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar back />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>專注報告</Text>

        {/* 數據卡 */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.statsCard}>
              <StatRow icon="⏱" label="實際專注" value={formatDuration(result.actual_duration ?? 0)} />
              <StatRow icon="⏸" label="暫停次數" value={`${result.pause_count ?? 0} 次`} />
              <StatRow icon="📱" label="切出 App" value={`${result.left_app_count ?? 0} 次`} />
            </View>
          </FrostCard>
        </View>

        {/* DISC 類型卡 */}
        <View style={styles.section}>
          <FrostCard radius={24}>
            <View style={styles.discRow}>
              <Text style={styles.discEmoji}>{disc.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.discLabel}>{disc.label}</Text>
                <Text style={styles.discDesc}>{disc.desc}</Text>
              </View>
            </View>
          </FrostCard>
        </View>

        {/* XP 明細卡 */}
        <View style={styles.section}>
          <FrostCard radius={24} padded={false}>
            <View style={styles.xpCard}>
              <Text style={styles.xpTotal}>獲得 XP：+{result.xp_gained ?? 0} XP</Text>
              {xpDetails.map((d, i) => (
                <View key={i} style={styles.xpRow}>
                  <Text style={styles.xpItemLabel}>{d.label}</Text>
                  <Text style={[styles.xpItemValue, d.value < 0 && styles.negative]}>
                    {d.value > 0 ? `+${d.value}` : d.value} XP
                  </Text>
                </View>
              ))}
            </View>
          </FrostCard>
        </View>

        {/* 操作按鈕 */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.75}>
            <Text style={styles.actionBtnText}>📤  分享</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave} activeOpacity={0.75}>
            <Text style={styles.actionBtnText}>💾  儲存圖片</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/(app)/home')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>回首頁</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── 輔助元件 ──────────────────────────────────
function StatRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// XP 明細（根據 result 與本地統計推算；真實明細應由後端回傳）
function buildXPDetails(result: SessionResult) {
  const details: { label: string; value: number }[] = [];
  if (!result.xp_gained) return details;

  const actualMin = Math.floor((result.actual_duration ?? 0) / 60);
  let base = 5;
  if (actualMin >= 60) base = 50;
  else if (actualMin >= 30) base = 30;
  else if (actualMin >= 15) base = 15;

  details.push({ label: '基礎 XP', value: base });

  const discKey = result.focus_type ?? '';
  // 加分項推算
  if (result.pause_count === 0) details.push({ label: '不暫停獎勵', value: 5 });
  if (result.left_app_count === 0) details.push({ label: '不切出獎勵', value: 5 });

  // 是否完成（score >= 2 → 有 completed 加分）
  const impliedCompleted = result.xp_gained >= base + 10;
  if (impliedCompleted) details.push({ label: '完成目標', value: 10 });

  return details;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 60 },
  title: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 36,
    fontWeight: '500',
    color: Colors.ink,
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  section: { marginTop: 12 },
  statsCard: { padding: 20, gap: 14 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { fontSize: 20, width: 28 },
  statLabel: { flex: 1, fontSize: 14, color: Colors.inkSoft },
  statValue: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  discRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  discEmoji: { fontSize: 32, marginTop: 2 },
  discLabel: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 17,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  discDesc: { fontSize: 13, color: Colors.inkSoft, marginTop: 4, lineHeight: 19 },
  xpCard: { padding: 20 },
  xpTotal: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 20,
    fontWeight: '500',
    color: Colors.ink,
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xpItemLabel: { fontSize: 13, color: Colors.inkSoft },
  xpItemValue: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  negative: { color: Colors.pinkHot },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 0.5,
    borderColor: 'rgba(20,16,28,0.08)',
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  homeBtn: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 9999,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  homeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 2 },
});
