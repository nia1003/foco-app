import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { PETS } from '@/constants/pets';
import { usePetStore } from '@/stores/petStore';
import type { SessionRecord, Task } from '@/types';
import { BarcodeStrip } from './BarcodeStrip';
import { SignaturePadModal } from './SignaturePadModal';
import { buildReceiptData } from './buildReceiptData';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppTheme } from '@/hooks/useAppTheme';
import { SessionShareCard } from './SessionShareCard';
import { sessionRecordToShareInput } from './sessionShareUtils';
import type { SavedSignature } from './signatureTypes';

type ShareTab = 'receipt' | 'focus';
const FOCUS_CARD_W = Dimensions.get('window').width - 88;

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const RULE = '- - - - - - - - - - - - - - - - - - - -';
const UNLOCKED_PETS = PETS.filter((p) => !p.locked);

function resolvePetIdFromStore(activePetName?: string | null): string {
  if (!activePetName) return UNLOCKED_PETS[0]?.id ?? 'xingwang';
  const match = UNLOCKED_PETS.find(
    (p) =>
      p.name.toLowerCase() === activePetName.toLowerCase() ||
      p.id === activePetName.toLowerCase(),
  );
  return match?.id ?? UNLOCKED_PETS[0]?.id ?? 'xingwang';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  sessions: SessionRecord[];
  tasks: Task[];
  userName: string | null;
  userEmail: string | null;
  petLevel?: number;
}

function ReceiptRule() {
  return <Text style={styles.rule}>{RULE}</Text>;
}

function ReceiptRow({
  left,
  right,
  bold,
}: {
  left: string;
  right: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLeft, bold && styles.bold]}>{left}</Text>
      <Text style={[styles.rowRight, bold && styles.bold]}>{right}</Text>
    </View>
  );
}

function LogRow({ title, right }: { title: string; right: string }) {
  return (
    <View style={styles.logRow}>
      <Text style={styles.logTitle} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.logDots} />
      <Text style={styles.logRight}>{right}</Text>
    </View>
  );
}

function SignaturePreview({ signature }: { signature: SavedSignature | null }) {
  if (!signature?.paths.length) {
    return <Text style={styles.signaturePlaceholder}>Tap to sign</Text>;
  }

  return (
    <Svg
      width="100%"
      height={96}
      viewBox={`0 0 ${signature.width} ${signature.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {signature.paths.map((d, i) => (
        <Path
          key={`sig-${i}`}
          d={d}
          stroke="#111"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}

export function ShareReceiptModal({
  visible,
  onClose,
  sessions,
  tasks,
  userName,
  userEmail,
  petLevel,
}: Props) {
  const insets = useSafeAreaInsets();
  const { screenBg } = useAppTheme();
  const chromeStyles = useThemedStyles(createShareChromeStyles);
  const { activePet } = usePetStore();
  const captureRefView = useRef<View>(null);

  const [shareTab, setShareTab] = useState<ShareTab>('receipt');
  const [sessionIndex, setSessionIndex] = useState(0);
  const [selectedPetId, setSelectedPetId] = useState(UNLOCKED_PETS[0]?.id ?? 'xingwang');
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [signature, setSignature] = useState<SavedSignature | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);

  const shareableSessions = useMemo(() => sessions.slice(0, 10), [sessions]);
  const currentSession = shareableSessions[sessionIndex];
  const sessionInput = currentSession ? sessionRecordToShareInput(currentSession) : null;

  useEffect(() => {
    if (visible) {
      setShareTab('receipt');
      setSessionIndex(0);
      setSelectedPetId(resolvePetIdFromStore(activePet?.name));
    }
  }, [visible, activePet?.name]);

  const receipt = useMemo(
    () => buildReceiptData(sessions, tasks, { userName, userEmail, petLevel }),
    [sessions, tasks, userName, userEmail, petLevel],
  );

  const petDef = UNLOCKED_PETS.find((p) => p.id === selectedPetId) ?? UNLOCKED_PETS[0];

  const handleShareImage = async () => {
    try {
      const uri = await captureRef(captureRefView, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: shareTab === 'receipt' ? "Share today's receipt" : 'Share focus card',
        });
      } else {
        Alert.alert('無法分享', '此裝置不支援分享功能');
      }
    } catch {
      Alert.alert('錯誤', '截圖失敗，請再試一次');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: screenBg }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeText}>✕ Close</Text>
        </TouchableOpacity>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, shareTab === 'receipt' && chromeStyles.tabBtnActive]}
            onPress={() => setShareTab('receipt')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, shareTab === 'receipt' && chromeStyles.tabBtnTextActive]}>
              Receipt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, shareTab === 'focus' && chromeStyles.tabBtnActive]}
            onPress={() => setShareTab('focus')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, shareTab === 'focus' && chromeStyles.tabBtnTextActive]}>
              Focus Card
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Capture frame — padding keeps edges visible in shared image */}
          <View ref={captureRefView} collapsable={false} style={styles.captureFrame}>
            {shareTab === 'receipt' ? (
            <View style={styles.receipt}>
              <Text style={styles.brand}>FOCO</Text>
              <Text style={styles.brandSub}>TODAY'S RECEIPT</Text>

              <ReceiptRule />

              <View style={styles.profileRow}>
                <TouchableOpacity
                  style={styles.avatarBox}
                  onPress={() => setPetPickerOpen(true)}
                  activeOpacity={0.85}
                >
                  {petDef.CustomComponent ? (
                    <PetRenderer pet={petDef} size={72} />
                  ) : (
                    <Image source={petDef.image} style={styles.avatarImg} resizeMode="contain" />
                  )}
                  <Text style={styles.avatarTapHint}>tap</Text>
                </TouchableOpacity>
                <View style={styles.profileMeta}>
                  <ReceiptRow left="name" right={receipt.name} />
                  <ReceiptRow left="mood" right={receipt.mood} />
                  <ReceiptRow left="role" right={receipt.role} />
                  <ReceiptRow left="day" right={receipt.dayName} />
                </View>
              </View>

              <ReceiptRule />

              <ReceiptRow left="DATE" right={receipt.dateStr} />
              <ReceiptRow left="TIME" right={receipt.timeStr} />
              <ReceiptRow left="NO." right={receipt.receiptNo} />

              <ReceiptRule />

              <Text style={styles.sectionLabel}>TODAY LOG</Text>
              {receipt.logItems.length === 0 ? (
                <Text style={styles.emptyLog}>No completed tasks today</Text>
              ) : (
                receipt.logItems.map((item, i) => (
                  <LogRow
                    key={`${item.title}-${item.right}-${i}`}
                    title={item.title}
                    right={item.right}
                  />
                ))
              )}

              <ReceiptRule />

              <ReceiptRow
                left="ITEMS COMPLETED"
                right={String(receipt.itemsCompleted).padStart(2, '0')}
              />
              <ReceiptRow
                left="INTERRUPTIONS"
                right={String(receipt.interruptions).padStart(2, '0')}
              />

              <View style={styles.ruleSolid} />

              <ReceiptRow left="TOTAL ACTIVE TIME" right={receipt.totalActiveTime} bold />

              <ReceiptRule />

              <ReceiptRow left="AUTH" right={receipt.authCode} />
              <View style={styles.row}>
                <Text style={styles.rowLeft}>STATUS</Text>
                <Text style={[styles.rowRight, styles.bold]}>APPROVED</Text>
              </View>

              <TouchableOpacity
                style={styles.signatureBlock}
                onPress={() => setSignatureOpen(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.signatureHint}>SIGNATURE</Text>
                <View style={styles.signatureArea}>
                  <SignaturePreview signature={signature} />
                </View>
              </TouchableOpacity>

              <View style={styles.ruleSolid} />

              <BarcodeStrip value={receipt.barcodeValue} seed={receipt.barcodeSeed} />

              <ReceiptRule />

              <Text style={styles.thanks}>thank you for your day.</Text>
              <Text style={styles.retain}>RETAIN THIS COPY FOR YOUR RECORDS</Text>
            </View>
            ) : sessionInput ? (
              <View style={styles.focusCapture}>
                {shareableSessions.length > 1 && (
                  <View style={styles.sessionNav}>
                    <TouchableOpacity
                      style={styles.sessionNavBtn}
                      onPress={() => setSessionIndex((i) => Math.max(0, i - 1))}
                      disabled={sessionIndex === 0}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.sessionNavArrow, sessionIndex === 0 && styles.sessionNavDisabled]}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.sessionNavLabel}>
                      Session {sessionIndex + 1} / {shareableSessions.length}
                    </Text>
                    <TouchableOpacity
                      style={styles.sessionNavBtn}
                      onPress={() =>
                        setSessionIndex((i) => Math.min(shareableSessions.length - 1, i + 1))
                      }
                      disabled={sessionIndex >= shareableSessions.length - 1}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.sessionNavArrow,
                          sessionIndex >= shareableSessions.length - 1 && styles.sessionNavDisabled,
                        ]}
                      >
                        ›
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                <SessionShareCard
                  qualityScore={sessionInput.quality_score}
                  duration={sessionInput.actual_duration}
                  pauses={sessionInput.pause_count}
                  leftApp={sessionInput.left_app_count}
                  startedAt={sessionInput.started_at}
                  taskTitle={sessionInput.task_title}
                  events={sessionInput.events}
                  cardWidth={FOCUS_CARD_W}
                />
              </View>
            ) : (
              <Text style={styles.emptyFocus}>No focus sessions yet.</Text>
            )}
          </View>

          <TouchableOpacity
            style={chromeStyles.shareBtn}
            onPress={handleShareImage}
            activeOpacity={0.88}
          >
            <Text style={chromeStyles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Pet picker */}
        <Modal
          visible={petPickerOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setPetPickerOpen(false)}
        >
          <TouchableOpacity
            style={styles.petOverlay}
            activeOpacity={1}
            onPress={() => setPetPickerOpen(false)}
          >
            <View style={styles.petSheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.petSheetTitle}>CHOOSE PET</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
                {UNLOCKED_PETS.map((pet) => {
                  const selected = pet.id === selectedPetId;
                  return (
                    <TouchableOpacity
                      key={pet.id}
                      style={[styles.petOption, selected && styles.petOptionSelected]}
                      onPress={() => {
                        setSelectedPetId(pet.id);
                        setPetPickerOpen(false);
                      }}
                      activeOpacity={0.85}
                    >
                      {pet.CustomComponent ? (
                        <PetRenderer pet={pet} size={56} />
                      ) : (
                        <Image source={pet.image} style={styles.petOptionImg} resizeMode="contain" />
                      )}
                      <Text style={[styles.petOptionName, selected && styles.petOptionNameSelected]}>
                        {pet.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <SignaturePadModal
          visible={signatureOpen}
          initial={signature}
          onCancel={() => setSignatureOpen(false)}
          onSave={(saved) => {
            setSignature(saved);
            setSignatureOpen(false);
          }}
        />
      </View>
    </Modal>
  );
}

function createShareChromeStyles({ surfaces }: AppTheme) {
  return StyleSheet.create({
    tabBtnActive: {
      backgroundColor: surfaces.ctaBg,
      borderColor: surfaces.ctaBg,
    },
    tabBtnTextActive: {
      color: surfaces.ctaText,
    },
    shareBtn: {
      marginTop: 20,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: surfaces.ctaBg,
    },
    shareBtnText: {
      fontFamily: MONO,
      fontSize: 14,
      fontWeight: '700',
      color: surfaces.ctaText,
      letterSpacing: 2,
    },
  });
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  closeBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(20,16,28,0.15)',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  tabBtnText: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(20,16,28,0.55)',
    letterSpacing: 0.5,
  },
  focusCapture: { alignItems: 'center', width: '100%' },
  sessionNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sessionNavBtn: { padding: 8 },
  sessionNavArrow: { fontSize: 22, color: '#111', fontWeight: '300' },
  sessionNavDisabled: { color: 'rgba(20,16,28,0.25)' },
  sessionNavLabel: {
    fontFamily: MONO,
    fontSize: 11,
    color: 'rgba(20,16,28,0.5)',
    letterSpacing: 0.5,
  },
  emptyFocus: {
    fontFamily: MONO,
    fontSize: 12,
    color: 'rgba(20,16,28,0.45)',
    textAlign: 'center',
    paddingVertical: 40,
  },
  closeText: {
    fontFamily: MONO,
    fontSize: 13,
    color: 'rgba(20,16,28,0.55)',
    letterSpacing: 0.5,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  captureFrame: {
    backgroundColor: '#fff',
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(20,16,28,0.1)',
    borderRadius: 4,
  },
  receipt: {
    backgroundColor: '#fff',
    paddingVertical: 4,
  },
  brand: {
    fontFamily: MONO,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
    letterSpacing: 1,
  },
  brandSub: {
    fontFamily: MONO,
    fontSize: 12,
    textAlign: 'center',
    color: '#111',
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 12,
  },
  rule: {
    fontFamily: MONO,
    fontSize: 10,
    color: 'rgba(20,16,28,0.35)',
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 1,
  },
  ruleSolid: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#111',
    marginVertical: 12,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  avatarBox: {
    width: 88,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: 'rgba(20,16,28,0.12)',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  avatarImg: { width: 72, height: 72 },
  avatarTapHint: {
    fontFamily: MONO,
    fontSize: 8,
    color: 'rgba(20,16,28,0.35)',
    letterSpacing: 1,
    marginTop: 2,
  },
  profileMeta: { flex: 1, gap: 6, paddingTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  rowLeft: {
    fontFamily: MONO,
    fontSize: 12,
    color: 'rgba(20,16,28,0.55)',
    textTransform: 'lowercase',
  },
  rowRight: {
    fontFamily: MONO,
    fontSize: 12,
    color: '#111',
    textAlign: 'right',
    flexShrink: 1,
  },
  bold: { fontWeight: '700' },
  sectionLabel: {
    fontFamily: MONO,
    fontSize: 11,
    color: 'rgba(20,16,28,0.45)',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  emptyLog: {
    fontFamily: MONO,
    fontSize: 11,
    color: 'rgba(20,16,28,0.4)',
    marginBottom: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 4,
  },
  logTitle: {
    fontFamily: MONO,
    fontSize: 12,
    color: '#111',
    maxWidth: '38%',
  },
  logDots: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
    borderColor: 'rgba(20,16,28,0.25)',
    marginBottom: 3,
    minWidth: 12,
  },
  logRight: {
    fontFamily: MONO,
    fontSize: 12,
    color: '#111',
    minWidth: 56,
    textAlign: 'right',
  },
  signatureBlock: { marginTop: 14 },
  signatureHint: {
    fontFamily: MONO,
    fontSize: 10,
    color: 'rgba(20,16,28,0.4)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  signatureArea: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    paddingBottom: 4,
    overflow: 'hidden',
  },
  signaturePlaceholder: {
    fontFamily: MONO,
    fontSize: 11,
    color: 'rgba(20,16,28,0.3)',
  },
  thanks: {
    fontFamily: MONO,
    fontSize: 13,
    textAlign: 'center',
    color: '#111',
    marginTop: 8,
  },
  retain: {
    fontFamily: MONO,
    fontSize: 10,
    textAlign: 'center',
    color: 'rgba(20,16,28,0.45)',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },
  petOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,16,28,0.4)',
    justifyContent: 'flex-end',
  },
  petSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(20,16,28,0.1)',
  },
  petSheetTitle: {
    fontFamily: MONO,
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  petRow: { gap: 12, paddingRight: 8 },
  petOption: {
    width: 88,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(20,16,28,0.12)',
    backgroundColor: '#fafafa',
  },
  petOptionSelected: {
    borderColor: '#111',
    backgroundColor: '#fff',
  },
  petOptionImg: { width: 56, height: 56 },
  petOptionName: {
    fontFamily: MONO,
    fontSize: 10,
    color: 'rgba(20,16,28,0.5)',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  petOptionNameSelected: { color: '#111', fontWeight: '700' },
});
