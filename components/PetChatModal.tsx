import { Fonts } from '@/constants/fonts';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { FrostCard } from '@/components/ui/FrostCard';
import { PetRenderer } from '@/components/pets/PetRenderer';
import { Colors } from '@/constants/theme';
import { useSound } from '@/components/SoundProvider';
import { chatWithPet } from '@/services/focoService';
import type { Pet } from '@/constants/pets';

interface Message {
  id: string;
  role: 'user' | 'pet';
  text: string;
}

interface PetChatModalProps {
  visible: boolean;
  onClose: () => void;
  pet: Pet;
}

const QUICK_PROMPTS = ['最近怎麼樣？', '幫我加油！', '你喜歡什麼？', '我需要動力'];

export function PetChatModal({ visible, onClose, pet }: PetChatModalProps) {
  const { play } = useSound();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);
  const lastSentAt = useRef(0);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Client-side 10s guard
    if (Date.now() - lastSentAt.current < 10_000) return;
    lastSentAt.current = Date.now();

    play('tap');
    setInput('');
    Keyboard.dismiss();

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const reply = await chatWithPet(pet.id, trimmed);
      const petMsg: Message = { id: `p-${Date.now()}`, role: 'pet', text: reply };
      setMessages((prev) => [...prev, petMsg]);
      play('transition_up');
    } catch (e: any) {
      const errText = e?.message === 'rate_limited'
        ? '再等一下嘛～'
        : '嗯……說不出話來。';
      setMessages((prev) => [...prev, { id: `p-${Date.now()}`, role: 'pet', text: errText }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const handleClose = () => {
    play('tap');
    setMessages([]);
    setInput('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.petPreview}>
                <PetRenderer pet={pet} size={44} interactive={false} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petTrait}>{pet.trait}</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Message list */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <PetRenderer pet={pet} size={90} interactive={false} />
                  <Text style={styles.emptyText}>跟 {pet.name} 說說話吧！</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubblePet]}>
                  <Text style={[styles.bubbleText, item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextPet]}>
                    {item.text}
                  </Text>
                </View>
              )}
            />

            {/* Typing indicator */}
            {loading && (
              <View style={styles.typingRow}>
                <Text style={[styles.typingDot, { opacity: 0.4 }]}>●</Text>
                <Text style={[styles.typingDot, { opacity: 0.6 }]}>●</Text>
                <Text style={[styles.typingDot, { opacity: 0.9 }]}>●</Text>
              </View>
            )}

            {/* Quick prompts — shown only when chat is empty */}
            {messages.length === 0 && !loading && (
              <View style={styles.quickRow}>
                {QUICK_PROMPTS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={styles.quickChip}
                    onPress={() => send(q)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.quickChipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Input bar */}
            <FrostCard radius={28} padded={false}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder={`跟 ${pet.name} 說…`}
                  placeholderTextColor={Colors.inkFaint}
                  returnKeyType="send"
                  onSubmitEditing={() => send(input)}
                  editable={!loading}
                  multiline={false}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: pet.accent }, (!input.trim() || loading) && styles.sendBtnDisabled]}
                  disabled={!input.trim() || loading}
                  onPress={() => send(input)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sendIcon}>↑</Text>
                </TouchableOpacity>
              </View>
            </FrostCard>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.softBg },
  inner: { flex: 1, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(20,16,28,0.10)',
  },
  petPreview: { width: 44, height: 44 },
  petName: { fontFamily: Fonts.display, fontSize: 17, fontWeight: '500', color: Colors.ink },
  petTrait: { fontSize: 12, color: Colors.inkFaint, marginTop: 1 },
  closeBtn: { padding: 6 },
  closeIcon: { fontSize: 16, color: Colors.inkSoft },

  listContent: { paddingVertical: 16, gap: 10, flexGrow: 1 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.inkFaint },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.ink,
    borderBottomRightRadius: 4,
  },
  bubblePet: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextPet: { color: Colors.ink },

  typingRow: {
    flexDirection: 'row', gap: 4, paddingVertical: 8, paddingLeft: 4,
  },
  typingDot: { fontSize: 10, color: Colors.inkSoft },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.70)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(20,16,28,0.12)',
  },
  quickChipText: { fontSize: 13, color: Colors.ink },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: Colors.ink, paddingVertical: 4 },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
  sendIcon: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
