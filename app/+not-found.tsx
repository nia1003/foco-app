import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';

export default function NotFound() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={{ fontSize: 64 }}>🌫️</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.sub}>Looks like your pet wandered off.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(app)/home')}>
          <Text style={styles.btnText}>Go home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.beige },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '700' as const, color: Colors.ink },
  sub: { fontSize: FontSize.md, color: Colors.inkSoft },
  btn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    height: 48,
    borderRadius: 999,
    backgroundColor: Colors.ink,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  btnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' as const },
});
