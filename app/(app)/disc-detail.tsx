import { Fonts } from '@/constants/fonts';
/**
 * DISC Detail — explains the four focus personality types.
 * Reached by tapping "Focus type breakdown" on the Stats screen.
 * Receives `dominant` param to highlight the user's current type.
 */
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { Colors } from '@/constants/theme';
import { useSound } from '@/components/SoundProvider';
import { useAppTheme } from '@/hooks/useAppTheme';

// ── DISC data ────────────────────────────────────────────────────

type TypeKey = 'dominance' | 'influence' | 'steadiness' | 'conscientiousness';

interface DiscType {
  key: TypeKey;
  icon: string;
  label: string;
  chinese: string;
  color: string;
  tagline: string;
  description: string;
  strengths: string[];
  watch: string;
}

const DISC_TYPES: DiscType[] = [
  {
    key: 'conscientiousness',
    icon: '◈',
    label: 'Conscientiousness',
    chinese: '謹慎型',
    color: '#4A90E2',
    tagline: '深思熟慮，精益求精',
    description:
      '謹慎型專注者重視品質勝於速度。你在進入心流前會確保環境和計畫都到位，一旦開始就會全神貫注，幾乎不中斷。你的工作成果往往更完善、更正確，是團隊中的「品質守門人」。',
    strengths: ['幾乎不中斷', '專注品質高', '完成率高', '自我要求強'],
    watch: '避免因追求完美而延後開始，有時「足夠好」就已足夠。',
  },
  {
    key: 'dominance',
    icon: '▲',
    label: 'Dominance',
    chinese: '主導型',
    color: '#b5607a',
    tagline: '目標導向，快速推進',
    description:
      '主導型專注者以結果為驅動力。你傾向直接切入核心，不喜歡拖延，會在設定的時間內堅持到底。即使遇到中斷也能迅速回到軌道，對自己和工作有強烈的控制感。',
    strengths: ['意志力強', '完成率高', '抗干擾', '決策快速'],
    watch: '高強度的專注可能導致疲勞，記得在 session 之間補充休息。',
  },
  {
    key: 'steadiness',
    icon: '◉',
    label: 'Steadiness',
    chinese: '穩健型',
    color: '#5BAD6F',
    tagline: '持續積累，穩中求進',
    description:
      '穩健型專注者節奏穩定、不疾不徐。你偏好固定的工作習慣和熟悉的環境，一旦養成 routine 就能持續累積成果。你的長期堅持力是最大資產，適合需要長時間投入的深度工作。',
    strengths: ['節奏穩定', '習慣養成快', '長期堅持', '不易因壓力失控'],
    watch: '對突如其來的中斷或計畫變更可能感到不適，試著培養應變彈性。',
  },
  {
    key: 'influence',
    icon: '◆',
    label: 'Influence',
    chinese: '影響型',
    color: '#F5A623',
    tagline: '靈活彈性，充滿創意',
    description:
      '影響型專注者思維靈活、充滿好奇。你的工作節奏可能不那麼線性，但常常在不同想法之間產生有趣的連結。即使 session 中途改變方向，你也能帶來新的視角和創意能量。',
    strengths: ['想法豐富', '彈性高', '跨領域聯想', '適應力強'],
    watch: '容易受外部刺激分心，嘗試用任務卡鎖定單一目標，減少跳躍式思考。',
  },
];

// ── Component ────────────────────────────────────────────────────

export default function DiscDetailScreen() {
  const { screenBg } = useAppTheme();
  const router = useRouter();
  const { dominant } = useLocalSearchParams<{ dominant?: string }>();
  const { play } = useSound();

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { play('tap'); router.replace('/(app)/stats'); }} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Focus Styles</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          每次 focus session 結束後，FOCO 會根據你的中斷頻率和完成情況判斷你的專注風格。
          以下是四種風格的完整說明。
        </Text>

        {DISC_TYPES.map((type) => {
          const isYours = type.key === dominant;
          return (
            <View key={type.key} style={styles.cardWrap}>
              <FrostCard radius={20} padded={false}>
                <View style={styles.card}>
                  {/* Type header */}
                  <View style={styles.typeHeader}>
                    <View style={[styles.iconBubble, { backgroundColor: type.color + '22' }]}>
                      <Text style={[styles.typeIcon, { color: type.color }]}>{type.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.labelRow}>
                        <Text style={styles.typeLabel}>{type.label}</Text>
                        {isYours && (
                          <View style={[styles.yourBadge, { backgroundColor: type.color + '22' }]}>
                            <Text style={[styles.yourBadgeText, { color: type.color }]}>你的風格</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.typeChinese}>{type.chinese} · {type.tagline}</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.desc}>{type.description}</Text>

                  {/* Strengths */}
                  <View style={styles.strengthsRow}>
                    {type.strengths.map((s) => (
                      <View key={s} style={[styles.strengthChip, { backgroundColor: type.color + '18' }]}>
                        <Text style={[styles.strengthText, { color: type.color }]}>{s}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Watch out */}
                  <View style={styles.watchBox}>
                    <Text style={styles.watchLabel}>注意</Text>
                    <Text style={styles.watchText}>{type.watch}</Text>
                  </View>
                </View>
              </FrostCard>
              {isYours && (
                <View style={[styles.yourIndicator, { backgroundColor: type.color }]} />
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(20,16,28,0.06)',
  },
  backIcon: { fontSize: 18, color: Colors.ink },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.ink,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  subtitle: {
    fontSize: 14,
    color: Colors.inkSoft,
    lineHeight: 22,
    marginBottom: 24,
  },

  cardWrap: { marginBottom: 16, position: 'relative' },

  yourIndicator: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 3,
    borderRadius: 2,
  },

  card: { padding: 20 },

  typeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  iconBubble: {
    width: 48, height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: { fontSize: 22, fontWeight: '700' },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typeLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.ink,
  },
  yourBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  yourBadgeText: { fontSize: 11, fontWeight: '700' },

  typeChinese: {
    fontSize: 13,
    color: Colors.inkSoft,
    marginTop: 2,
  },

  desc: {
    fontSize: 14,
    color: Colors.inkSoft,
    lineHeight: 22,
    marginBottom: 14,
  },

  strengthsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  strengthChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  strengthText: { fontSize: 12, fontWeight: '600' },

  watchBox: {
    backgroundColor: 'rgba(20,16,28,0.04)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  watchLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 0.5,
    paddingTop: 2,
  },
  watchText: {
    flex: 1,
    fontSize: 13,
    color: Colors.inkSoft,
    lineHeight: 20,
  },
});
