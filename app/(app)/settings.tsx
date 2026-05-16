/**
 * SettingsScreen — 帳號、偏好設定、登出
 * FOCO 設計風格（FrostCard + AppBackground + FocoBar）
 */
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
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
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, userEmail, userName } = useAuthStore();
  const { reset: resetPets } = usePetStore();

  const { playToggle } = useSound();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const displayName = userName ?? userEmail?.split('@')[0] ?? '—';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  // ── 登出 ────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      '登出',
      '確定要登出嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '登出',
          style: 'destructive',
          onPress: async () => {
            // 1. 清除 petStore 狀態 + AsyncStorage activePetId
            resetPets();
            // 2. 登出 Supabase session + 清除 authStore
            await logout();
            // 3. 回到登入頁
            router.replace('/(auth)');
          },
        },
      ],
    );
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
        <Text style={styles.title}>Settings</Text>

        {/* ── 帳號 ── */}
        <Section label="ACCOUNT">
          <FrostCard radius={20} padded={false}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{userEmail ?? '—'}</Text>
              </View>
            </View>
          </FrostCard>
        </Section>

        {/* ── 偏好設定 ── */}
        <Section label="PREFERENCES">
          <FrostCard radius={20} padded={false}>
            <ToggleRow
              label="音效"
              sub="計時期間的提示音"
              value={soundEnabled}
              onChange={(v) => { playToggle(v); setSoundEnabled(v); }}
            />
            <View style={styles.divider} />
            <ToggleRow
              label="通知"
              sub="專注結束時提醒"
              value={notifEnabled}
              onChange={(v) => { playToggle(v); setNotifEnabled(v); }}
            />
          </FrostCard>
        </Section>

        {/* ── 關於 ── */}
        <Section label="ABOUT">
          <FrostCard radius={20} padded={false}>
            <AboutRow label="版本" value="1.0.0" />
            <View style={styles.divider} />
            <AboutRow label="隱私政策" value="›" />
            <View style={styles.divider} />
            <AboutRow label="服務條款" value="›" />
          </FrostCard>
        </Section>

        {/* ── 登出 ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── 小元件 ──────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: Colors.pinkHot, false: 'rgba(20,16,28,0.12)' }}
        thumbColor="#fff"
      />
    </View>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.aboutRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f4f4' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 80 },

  title: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 42,
    fontWeight: '500',
    color: Colors.ink,
    marginTop: 8,
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  section: { marginTop: 20 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.inkFaint,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.pinkHot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileName: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.inkSoft,
    marginTop: 2,
  },

  // Rows
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(20,16,28,0.08)',
    marginHorizontal: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.ink,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.inkSoft,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 15,
    color: Colors.inkSoft,
  },

  // Logout
  logoutBtn: {
    marginTop: 28,
    height: 52,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: '#e05555',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224,85,85,0.06)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e05555',
    letterSpacing: 0.3,
  },
});
