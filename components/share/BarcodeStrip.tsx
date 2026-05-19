import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const BAR_HEIGHT = 52;

function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function buildBars(seed: string, count = 56): { key: string; width: number }[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, (_, i) => ({
    key: `b-${i}`,
    width: rand() > 0.55 ? 3 : 2,
  }));
}

interface Props {
  /** Display text under bars (e.g. date.time). */
  value: string;
  /** Seed for bar pattern — use date + receipt no for stable daily randomness. */
  seed: string;
}

/** Receipt-style barcode — uniform bar height, seeded pattern from date. */
export function BarcodeStrip({ value, seed }: Props) {
  const bars = useMemo(() => buildBars(seed), [seed]);

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {bars.map((b) => (
          <View key={b.key} style={[styles.bar, { width: b.width }]} />
        ))}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 8 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    height: BAR_HEIGHT,
    paddingHorizontal: 12,
  },
  bar: {
    height: BAR_HEIGHT,
    backgroundColor: '#111',
    borderRadius: 1,
  },
  value: {
    marginTop: 8,
    fontSize: 11,
    letterSpacing: 2,
    color: '#111',
    fontFamily: MONO,
  },
});
