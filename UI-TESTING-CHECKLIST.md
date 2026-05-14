# 🧪 React Native Expo UI Testing Checklist
**Date**: 2026-05-08 | **Status**: Ready for Testing  
**Goal**: Verify that React Native components match web design with corrected theme values

---

## ✅ Phase 1: Theme Values Verification (COMPLETED)

### Design Tokens Successfully Updated
All values extracted from web repo's `tailwind.config.js` and `index.css`:

#### 🎨 Colors (Web-Aligned)
```
Primary:        #27272a (deep gray, accent color)
Primary Blue:   #1d4ed8 (action blue)
Primary Green:  #166534 (success green)
White:          #FFFFFF
Text Primary:   #111827 (dark gray)
Text Secondary: #6B7280 (medium gray)
Surface:        #FFFFFF
Border:         #E5E7EB (light gray)
Background:     #F5F5F5 (off-white)
```

#### 📏 Spacing (Tailwind Mapped)
```
xs: 4px   (Tailwind gap-1)
sm: 6px   (Tailwind gap-1.5)
md: 8px   (Tailwind gap-2)
lg: 12px  (Tailwind gap-3)
xl: 16px  (Tailwind gap-4)
2xl: 24px (Tailwind gap-6)
3xl: 32px (Tailwind gap-8)
4xl: 48px (Tailwind gap-12)
```

#### 🔘 Border Radius (Web Mapped)
```
xs:   4px   (rounded-sm)
sm:   8px   (rounded)
md:   12px  (rounded-md)
lg:   16px  (rounded-lg)
xl:   20px  (rounded-xl)
2xl:  24px  (rounded-2xl)
3xl:  32px  (rounded-3xl)
full: 9999px (rounded-full, pill shape)
```

---

## ✅ Phase 2: Component Updates (COMPLETED)

### Modified Components ✨

| Component | Change | Before | After | Visual Impact |
|-----------|--------|--------|-------|--------------|
| **Button.tsx** | `borderRadius` | `Radius.md` (12px) | `Radius.full` (9999px) | Pill-shaped buttons matching web |
| **Card.tsx** | `borderRadius` | `Radius.lg` (16px) | `Radius.2xl` (24px) | More pronounced rounded corners |
| **Input.tsx** | `borderRadius` | `Radius.md` (12px) | `Radius.lg` (16px) | Slightly rounder input fields |
| **PomodoroDotPicker.tsx** | `gap` | `Spacing.sm` (6px) | `Spacing.md` (8px) | Better visual spacing between dots |

### Unchanged Components ✓
- **GlassCard.tsx** — Already using `Radius.xl` (20px) ✓
- **Other UI components** — Theme-consistent, no changes needed

---

## 🧪 Phase 3: How to Test in Expo Go (Recommended - Faster)

### Option A: iOS Simulator (Slower, ~10-15 min build)
Terminal shows: `Press i | open iOS simulator`
- Building in background, will auto-launch when ready

### Option B: Expo Go on Physical Device (Fastest - 2-3 min)
1. **Install Expo Go** from App Store (iOS) or Play Store (Android)
2. **Open Metro terminal** and look for QR code
3. **Scan QR code** with Camera app (iOS) or Expo Go app (Android)
4. **App loads** in ~30-60 seconds

### Option C: Android Emulator
Terminal shows: `Press a | open Android`

---

## 👁️ Visual Testing Checklist

When app loads, verify these components match web design:

### 1. **Buttons** ✓
- [ ] All buttons are **pill-shaped** (rounded ends on left/right)
- [ ] Button text is centered and clean
- [ ] Primary button: Dark color (#27272a or gradient)
- [ ] Secondary button: Medium gray (#6B7280)
- [ ] Outline button: Border with transparent fill
- [ ] Ghost button: Text only, no background

**Reference**: Compare with web app buttons at https://foco-app.vercel.app

### 2. **Cards** ✓
- [ ] Cards have **rounded corners** (24px, noticeably curved)
- [ ] Cards have subtle border (#E5E7EB light gray)
- [ ] Cards have white background (#FFFFFF)
- [ ] Cards cast soft shadow (elevation/shadowOpacity)

**Location**: Task list, pet display, stats sections

### 3. **Input Fields** ✓
- [ ] Input borders are **moderately rounded** (16px)
- [ ] Input has white background (#FFFFFF)
- [ ] Input border is light gray (#E5E7EB)
- [ ] Focus state shows darker border
- [ ] Password field shows eye icon toggle (👁/🙈)

**Location**: Task name input, settings fields

### 4. **Pomodoro Dot Picker** ✓
- [ ] Dots are properly **spaced** (8px gap between dots)
- [ ] Inactive dots: light gray border (#E5E7EB), white fill
- [ ] Active dots: filled with primary color (#27272a)
- [ ] Dots are circular (28x28px size maintained)

**Location**: Task creation screen, pomodoro selection

### 5. **Overall Colors** ✓
- [ ] Text is dark gray (#111827), not pure black
- [ ] Disabled text is lighter gray (#9CA3AF)
- [ ] Borders are very light gray (#E5E7EB)
- [ ] White surfaces stand out from light background (#F5F5F5)

---

## 🔍 Troubleshooting

### App Won't Load / Shows Blank Screen
- Check terminal for red errors
- Try: `Press r | reload app` (in terminal)
- Or close Expo Go and re-scan QR code

### Components Look Different
- **Spacing off?** Check that values in `constants/theme.ts` are numeric (4, 6, 8...) not NaN
  ```ts
  // ✓ Correct
  export const Spacing = { "xs": 4, "sm": 6, ... }
  
  // ✗ Wrong (was before fix)
  export const Spacing = { "xs": null, "sm": null, ... }
  ```

- **Radius not rounded?** Verify Radius values:
  ```ts
  // ✓ Correct values
  "full": 9999,  // Pills
  "2xl": 24,     // Cards
  "lg": 16,      // Inputs
  ```

### Yellow Warnings in Console
- `WARN expo-notifications:` — Safe, functionality provided
- `WARN expo-av:` — Safe, audio playback ready
- These do NOT break functionality

---

## 📊 Success Criteria

### ✅ All Pass = UI Matches Web Design

```
✓ Button: Pill-shaped (full rounded)
✓ Card: Rounded corners (24px)
✓ Input: Moderate rounding (16px)
✓ DotPicker: Proper spacing (8px)
✓ Colors: Web-aligned palette
✓ Text: Gray tones match design
✓ Shadows: Subtle elevation visible
✓ No layout shifts or sizing issues
```

### ⚠️ Common "Not a Problem" Issues
- Terminal shows yellow WARN messages → **OK**, these are info-level
- App reloads when you edit code → **Expected**, hot reload
- Spacing slightly pixel-off on some screens → **OK**, density differences
- Some fonts differ → **OK**, using system fonts (designed in)

---

## 📝 Testing Results

After testing, fill in:

```
Date Tested: _______________
Device: iOS Simulator / Android Emulator / Physical Device
Platform: iOS / Android
Result: ✓ PASS / ✗ FAIL

Issues Found:
- [ ] (describe any visual differences)
- [ ] (describe any crashes)

Notes:
_________________________________
```

---

## 🎯 Next Steps After Testing

If UI renders correctly and matches web:
1. ✅ Verify all 4 component changes are visually correct
2. ✅ Test onboarding flow (Welcome → Signup → Profile)
3. ✅ Test task creation and timer functionality
4. ✅ Verify pet animations and stats display
5. ✅ Ready for Figma integration (tokens already prepared)

---

**Component Code Locations:**
- `components/ui/Button.tsx` — line 75: `borderRadius: Radius.full`
- `components/ui/Card.tsx` — line 33: `borderRadius: Radius.2xl`  
- `components/ui/Input.tsx` — line 70: `borderRadius: Radius.lg`
- `components/ui/PomodoroDotPicker.tsx` — line 50: `gap: Spacing.md`
- `constants/theme.ts` — 57 design tokens (auto-generated from tokens/tokens.json)

**Build Log Location:**
- `tokens/build-tokens.mjs` — Fixed: `.replace('px', '')` for unit parsing
