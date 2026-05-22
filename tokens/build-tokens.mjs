#!/usr/bin/env node
// ─────────────────────────────────────────────
// Token Build Script
// Input:  tokens/tokens.json
// Output: tokens/build/figma-tokens.json   (Tokens Studio import)
//         tokens/build/theme.generated.ts  (RN constants/theme.ts 同步來源)
//         tokens/build/tokens.css          (CSS custom properties)
// Run: node tokens/build-tokens.mjs
// ─────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BUILD_DIR = join(__dirname, 'build');

mkdirSync(BUILD_DIR, { recursive: true });

const raw = JSON.parse(readFileSync(join(__dirname, 'tokens.json'), 'utf-8'));

// ── 1. figma-tokens.json (Tokens Studio format) ──────────────────
writeFileSync(
  join(BUILD_DIR, 'figma-tokens.json'),
  JSON.stringify(raw, null, 2),
  'utf-8',
);
console.log('✅ tokens/build/figma-tokens.json');

// ── 2. theme.generated.ts (React Native) ─────────────────────────
const colors = Object.fromEntries(
  Object.entries(raw.color).map(([k, v]) => [k, v.value])
);
const spacing = Object.fromEntries(
  Object.entries(raw.spacing).map(([k, v]) => [k, Number(v.value.replace('px', ''))])
);
const borderRadius = Object.fromEntries(
  Object.entries(raw.borderRadius).map(([k, v]) => [k, Number(v.value.replace('px', ''))])
);
const fontSize = Object.fromEntries(
  Object.entries(raw.fontSize).map(([k, v]) => [k, Number(v.value.replace('px', ''))])
);
const fontWeight = Object.fromEntries(
  Object.entries(raw.fontWeight).map(([k, v]) => [k, v.value])
);

const themeTs = `// AUTO-GENERATED — do not edit manually.
// Source: tokens/tokens.json  |  Run: node tokens/build-tokens.mjs
// Copy this file to constants/theme.ts when tokens change.

export const Colors = ${JSON.stringify(colors, null, 2)} as const;

export const Spacing = ${JSON.stringify(spacing, null, 2)} as const;

export const Radius = ${JSON.stringify(borderRadius, null, 2)} as const;

export const FontSize = ${JSON.stringify(fontSize, null, 2)} as const;

export const FontWeight = ${JSON.stringify(fontWeight, null, 2)} as const;

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
};
`;
writeFileSync(join(BUILD_DIR, 'theme.generated.ts'), themeTs, 'utf-8');
console.log('✅ tokens/build/theme.generated.ts');

// ── 3. tokens.css (CSS custom properties) ────────────────────────
const cssLines = [':root {'];
Object.entries(raw.color).forEach(([k, v]) => {
  const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
  cssLines.push(`  --color-${cssKey}: ${v.value};`);
});
Object.entries(raw.spacing).forEach(([k, v]) => {
  cssLines.push(`  --spacing-${k}: ${v.value}px;`);
});
Object.entries(raw.borderRadius).forEach(([k, v]) => {
  const val = v.value === '9999' ? '9999px' : `${v.value}px`;
  cssLines.push(`  --radius-${k}: ${val};`);
});
Object.entries(raw.fontSize).forEach(([k, v]) => {
  cssLines.push(`  --font-size-${k}: ${v.value}px;`);
});
cssLines.push('}');
writeFileSync(join(BUILD_DIR, 'tokens.css'), cssLines.join('\n'), 'utf-8');
console.log('✅ tokens/build/tokens.css');

// ── Summary ──────────────────────────────────────────────────────
const tokenCount =
  Object.keys(raw.color).length +
  Object.keys(raw.spacing).length +
  Object.keys(raw.borderRadius).length +
  Object.keys(raw.fontSize).length +
  Object.keys(raw.fontWeight).length;

console.log(`\n📦 ${tokenCount} tokens exported to tokens/build/`);
console.log('\nNext steps:');
console.log('  1. Open Figma → Tokens Studio plugin → Import → figma-tokens.json');
console.log('  2. Apply tokens → Figma Variables 自動建立');
console.log('  3. If theme changed: cp tokens/build/theme.generated.ts constants/theme.ts');
