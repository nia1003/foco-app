// ─────────────────────────────────────────────
// Settings Screen
// ─────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';

const POMODORO_OPTIONS = [15, 20, 25, 30, 45, 60];

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { profile } = useUserStore();

  const [pomodoroMins, setPomodoroMins] = useState(25);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Settings" showBack />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profile?.username ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.username}>{profile?.username ?? 'Mochi'}</Text>
                <Text style={styles.userEmail}>{profile?.email ?? '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pomodoro duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FOCUS DURATION</Text>
          <View style={styles.card}>
            <Text style={styles.rowLabel}>Pomodoro length</Text>
            <View style={styles.pillRow}>
              {POMODORO_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pill, pomodoroMins === m && styles.pillActive]}
                  onPress={() => setPomodoroMins(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, pomodoroMins === m && styles.pillTextActive]}>
                    {m}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.rowLabel}>Sound effects</Text>
                <Text style={styles.rowSub}>Tick sounds during focus timer</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.rowLabel}>Notifications</Text>
                <Text style={styles.rowSub}>Alert when session completes</Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.card}>
            {[
              { label: 'Version', value: '1.0.0' },
              { label: 'Privacy policy', value: '›' },
              { label: 'Terms of service', value: '›' },
            ].map((row, i, arr) => (
              <React.Fragment key={row.label}>
                <View style={styles.aboutRow}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, gap: Spacing.md },

  section: { gap: Spacing.xs },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  username: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  userEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  rowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  rowSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  rowValue: { fontSize: FontSize.md, color: Colors.textSecondary },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pillActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  pillText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  pillTextActive: { color: Colors.white },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },

  logoutBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.error,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  logoutText: { color: Colors.error, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
