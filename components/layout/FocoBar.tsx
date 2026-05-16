/**
 * FocoBar — top brand bar with FOCO wordmark + optional back button / avatar.
 * Uses useSafeAreaInsets so the back button clears the Dynamic Island / notch.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

interface FocoBarProps {
  back?: boolean;
  avatar?: string | null;
  dark?: boolean;
}

export function FocoBar({ back = false, avatar = null, dark = false }: FocoBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fg         = dark ? '#fff' : Colors.ink;
  const mutedColor = dark ? 'rgba(255,255,255,0.6)' : Colors.inkSoft;
  const btnBg      = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)';
  const btnBorder  = dark ? 'rgba(255,255,255,0.15)' : 'rgba(20,16,28,0.08)';

  // Total bar height = 56px content + safe area top
  const barHeight = 56 + insets.top;
  // Button sits centred in the 56px content zone, below the safe area
  const btnTop    = insets.top + 9;   // 9 = (56 − 38) / 2

  return (
    <View style={[styles.bar, { height: barHeight, paddingTop: insets.top }]}>
      {back && (
        <TouchableOpacity
          style={[
            styles.iconBtn,
            { backgroundColor: btnBg, borderColor: btnBorder, top: btnTop },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          {/* Chevron left */}
          <View style={styles.chevronLeft}>
            <View style={[styles.chevronArm, { borderColor: mutedColor, transform: [{ rotate: '45deg' }, { translateY: 3 }] }]} />
            <View style={[styles.chevronArm, { borderColor: mutedColor, transform: [{ rotate: '-45deg' }, { translateY: -3 }] }]} />
          </View>
        </TouchableOpacity>
      )}

      <Text style={[styles.wordmark, { color: fg }]}>FOCO</Text>

      {avatar && (
        <View style={[styles.avatarBadge, { top: btnTop }]}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    position: 'relative',
    zIndex: 10,
  },
  wordmark: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 6,
    paddingLeft: 6,
  },
  iconBtn: {
    position: 'absolute',
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronLeft: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronArm: {
    width: 8,
    height: 0,
    borderTopWidth: 1.8,
    borderRadius: 1,
  },
  avatarBadge: {
    position: 'absolute',
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#c4b5d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
