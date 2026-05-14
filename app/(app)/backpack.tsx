/**
 * BackpackScreen — inventory grid (consumables + outfits).
 * iOS 26: FocoWallpaper + Glass tiles.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppBackground } from '@/components/ui/AppBackground';
import { Glass } from '@/components/ui/Glass';
import { FocoBar } from '@/components/layout/FocoBar';
import { Colors } from '@/constants/theme';

type TabType = 'consumables' | 'outfits';

const ITEMS: Record<TabType, Array<{ emoji: string; name: string; qty?: number; rarity: string }>> = {
  consumables: [
    { emoji: '🥕', name: 'Carrot', qty: 5, rarity: 'Common' },
    { emoji: '🍓', name: 'Strawberry', qty: 2, rarity: 'Rare' },
    { emoji: '🌟', name: 'Star Dust', qty: 1, rarity: 'Epic' },
    { emoji: '🍵', name: 'Focus Tea', qty: 3, rarity: 'Common' },
    { emoji: '🎈', name: 'Joy Balloon', qty: 1, rarity: 'Rare' },
    { emoji: '✨', name: 'Sparkle', qty: 8, rarity: 'Common' },
  ],
  outfits: [
    { emoji: '🎩', name: 'Top Hat', rarity: 'Rare' },
    { emoji: '🌸', name: 'Flower Crown', rarity: 'Common' },
    { emoji: '🎀', name: 'Pink Bow', rarity: 'Common' },
    { emoji: '⭐', name: 'Star Collar', rarity: 'Epic' },
  ],
};

const RARITY_COLORS: Record<string, string> = {
  Common: Colors.inkFaint,
  Rare: Colors.blueMid,
  Epic: Colors.pinkHot,
};

export default function BackpackScreen() {
  const [tab, setTab] = useState<TabType>('consumables');

  return (
    <View style={styles.root}>
      <AppBackground />
      <FocoBar back />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Backpack</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['consumables', 'outfits'] as TabType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabPill, tab === t && styles.tabPillActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Inventory grid */}
        <View style={styles.grid}>
          {ITEMS[tab].map((item, i) => (
            <TouchableOpacity key={i} style={styles.itemCell} activeOpacity={0.75}>
              <Glass radius={20} tone="chrome" padded={false}>
                <View style={styles.itemInner}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  {item.qty !== undefined && (
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>×{item.qty}</Text>
                    </View>
                  )}
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={[styles.itemRarity, { color: RARITY_COLORS[item.rarity] }]}>
                    {item.rarity}
                  </Text>
                </View>
              </Glass>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.beige },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 60 },
  title: { fontFamily: 'Fraunces_500Medium', fontSize: 42, fontWeight: '500', color: Colors.ink, marginTop: 12, letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 20 },
  tabPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.6)',
  },
  tabPillActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  tabLabel: { fontSize: 13, fontWeight: '500', color: Colors.inkSoft },
  tabLabelActive: { color: '#fff', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  itemCell: { width: '30%' },
  itemInner: { alignItems: 'center', padding: 14, gap: 6, position: 'relative' },
  itemEmoji: { fontSize: 32 },
  qtyBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: Colors.ink, borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  qtyText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  itemName: { fontSize: 11, fontWeight: '600', color: Colors.ink, textAlign: 'center' },
  itemRarity: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
});
