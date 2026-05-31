import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSound } from '@/components/SoundProvider';
import { AppBackground } from '@/components/ui/AppBackground';
import { FrostCard } from '@/components/ui/FrostCard';
import { FocoBar } from '@/components/layout/FocoBar';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  createSettingsStyles,
  type SettingsStyles,
} from '@/styles/settingsScreen.styles';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useAuthStore } from '@/stores/authStore';
import { usePetStore } from '@/stores/petStore';
import { audioService } from '@/services/audioService';

export default function SettingsScreen() {
  const router = useRouter();
  const { screenBg, colors } = useAppTheme();
  const styles = useThemedStyles(createSettingsStyles);
  const { logout, userEmail, userName, updateProfile } = useAuthStore();
  const { reset: resetPets } = usePetStore();
  const { play, playToggle } = useSound();

  const soundEnabled = usePreferencesStore((s) => s.soundEnabled);
  const darkMode = usePreferencesStore((s) => s.darkMode);
  const avatarUri = usePreferencesStore((s) => s.avatarUri);
  const setSoundEnabled = usePreferencesStore((s) => s.setSoundEnabled);
  const setDarkMode = usePreferencesStore((s) => s.setDarkMode);
  const setAvatarUri = usePreferencesStore((s) => s.setAvatarUri);

  const [nameDraft, setNameDraft] = useState(userName ?? '');
  const [savingName, setSavingName] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    setNameDraft(userName ?? userEmail?.split('@')[0] ?? '');
  }, [userName, userEmail]);

  const displayName = userName ?? userEmail?.split('@')[0] ?? '—';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      Alert.alert('名稱不可為空');
      return;
    }
    setSavingName(true);
    const { error } = await updateProfile({ name: trimmed });
    setSavingName(false);
    if (error) Alert.alert('更新失敗', error);
    else play('tap');
  };

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('需要相簿權限', '請在系統設定中允許存取相片');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;
    await setAvatarUri(uri);
    await updateProfile({ avatarUrl: uri });
    play('tap');
  };

  const handleLogout = () => {
    Alert.alert('登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '登出',
        style: 'destructive',
        onPress: async () => {
          resetPets();
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: screenBg }]}>
      <AppBackground />
      <FocoBar back />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Settings</Text>

        <Section label="ACCOUNT" styles={styles}>
          <FrostCard radius={20} padded={false}>
            <View style={styles.profileRow}>
              <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                )}
                <Text style={styles.changePhoto}>更換頭貼</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>使用者名稱</Text>
                <TextInput
                  style={styles.nameInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Your name"
                  placeholderTextColor={colors.inkFaint}
                />
                <TouchableOpacity
                  style={[styles.saveBtn, savingName && styles.saveBtnDisabled]}
                  onPress={handleSaveName}
                  disabled={savingName}
                >
                  <Text style={styles.saveBtnText}>
                    {savingName ? '儲存中…' : '儲存名稱'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.profileEmail}>{userEmail ?? '—'}</Text>
              </View>
            </View>
          </FrostCard>
        </Section>

        <Section label="PREFERENCES" styles={styles}>
          <FrostCard radius={20} padded={false}>
            <ToggleRow
              styles={styles}
              label="夜間模式"
              sub="深色背景與淺色文字"
              value={darkMode}
              onChange={(v) => {
                playToggle(v);
                void setDarkMode(v);
              }}
            />
            <View style={styles.divider} />
            <ToggleRow
              styles={styles}
              label="音效"
              sub="計時與按鈕提示音"
              value={soundEnabled}
              onChange={async (v) => {
                await setSoundEnabled(v);
                if (v) void audioService.playToggle(true);
              }}
            />
            <View style={styles.divider} />
            <ToggleRow
              styles={styles}
              label="通知"
              sub="專注結束時提醒"
              value={notifEnabled}
              onChange={(v) => {
                playToggle(v);
                setNotifEnabled(v);
              }}
            />
          </FrostCard>
        </Section>

        <Section label="ABOUT" styles={styles}>
          <FrostCard radius={20} padded={false}>
            <AboutRow styles={styles} label="版本" value="1.0.0" />
            <View style={styles.divider} />
            <AboutRow styles={styles} label="隱私政策" value="›" />
            <View style={styles.divider} />
            <AboutRow styles={styles} label="服務條款" value="›" />
          </FrostCard>
        </Section>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            play('tap');
            handleLogout();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>登出</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Section({
  label,
  children,
  styles,
}: {
  label: string;
  children: React.ReactNode;
  styles: SettingsStyles;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  styles,
  label,
  sub,
  value,
  onChange,
}: {
  styles: SettingsStyles;
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors, surfaces } = useAppTheme();
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.pinkHot, false: surfaces.chartTrack }}
        thumbColor="#fff"
      />
    </View>
  );
}

function AboutRow({
  styles,
  label,
  value,
}: {
  styles: SettingsStyles;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.aboutRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}
