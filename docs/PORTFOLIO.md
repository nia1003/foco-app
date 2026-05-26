# FOCO — AI Focus Companion App

> A gamified productivity app that turns focus sessions into a pet-raising experience.  
> Built solo end-to-end: product design → UI engineering → backend → DevOps.

---

## Overview

FOCO is a cross-platform mobile application (iOS / Android) that helps users build deep-focus habits through a companion-based gamification system. Instead of cold timers and streaks, FOCO pairs every focus session with a virtual pet — the pet grows as you focus, reacts to distraction, and accumulates personality traits based on your behavioral patterns over time.

The project spans the full product lifecycle: from user research and UX wireframing to TypeScript implementation, Supabase backend, Deno Edge Functions, and a CI/CD pipeline on GitHub Actions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 · React Native 0.81 · Expo Router v6 |
| Language | TypeScript (strict mode) |
| State Management | Zustand (`authStore` · `petStore` · `sessionStore`) |
| Backend | Supabase (PostgreSQL · Edge Functions · Auth · Realtime) |
| Animation | React Native Reanimated v4 · Gesture Handler v2 |
| Audio | `expo-av` with a global `SoundProvider` context |
| Charts | `react-native-svg` (radar chart · line chart · calendar heatmap) |
| Sharing | `react-native-view-shot` + `expo-sharing` |
| CI/CD | GitHub Actions → EAS Build (Expo Application Services) |
| Runtime (backend) | Deno (Supabase Edge Functions) |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Expo Router v6                  │
│   /(auth)  ←── route guard ──→  /(app)          │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼─────────────┐
        ▼            ▼             ▼
   authStore     petStore     sessionStore
  (Zustand)     (Zustand +   (Zustand + 5-min
                AsyncStorage)  stale cache)
        │            │             │
        └────────────┴─────────────┘
                     │
              Supabase Client
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
  PostgreSQL DB          Edge Function: session-complete
  (tables: sessions,     (Quality Score → DISC → XP →
   pets, tasks, users)    write DB → return result)
```

### Key Design Decisions

- **Backend-only scoring** — Quality Score and XP are computed exclusively in the Deno Edge Function. The client sends raw behavioral data (pause count, left-app count, duration); all derived values come back from the server. This prevents any client-side score manipulation.
- **Lazy fetch + stale cache** — `sessionStore` and `petStore` only fetch from Supabase when data is absent or older than 5 minutes. The app never pre-loads all data on startup.
- **API rate limiting** — Every backend-facing button is gated by a `useApiCall` hook that enforces a 10-second cooldown with live countdown UI, preventing double-submits and spam.
- **UI-thread animation** — The duration slider runs entirely on the native UI thread via Reanimated v4 `useSharedValue` / `useAnimatedStyle`, with `Gesture.Pan()` handling both tap-to-jump and continuous drag. No JS bridge involvement during user interaction.

---

## Core User Journey

```
Sign Up → OTP Verify → Choose Pet → Home
   ↓
Start Focus (set task + duration)
   ↓
Focus Timer (pause · resume · quit)
   ↓
Micro-Reflection Form (distraction tags · completion slider · mood)
   ↓
Reward Screen (pet animation · XP bar before→after)
   ↓
Analysis Card (Quality Score gradient · shareable image)
   ↓
Stats / DISC Dashboard
```

---

## Feature Deep-Dives

### 1. Focus Timer

**File:** `app/(app)/focus.tsx`

- Circular countdown rendered with `react-native-svg` arcs; smooth progress via `Animated.Value`
- Tracks three behavioral signals in real time: `pauseCount`, `leftAppCount`, `leftAppTotalSec`
- Background app-leave detection via `AppState` listener
- Quit-confirmation modal with frosted glass aesthetic
- On completion, calls the `session-complete` Edge Function and redirects to Reflection

### 2. Session-Complete Edge Function (Deno)

**File:** `supabase/functions/session-complete/index.ts`

The entire scoring pipeline runs server-side:

```
Quality Score (0–100)
  ├── Completion ratio × 70 pts
  ├── Completed bonus: +15 pts
  ├── Pause penalty: −5 pts each (cap −20)
  ├── Left-app penalty: −8 pts each (cap −25)
  └── Prolonged distraction (>2 min): −10 pts

DISC Focus Type (aggregate, not per-session)
  ├── dominance      → high score, zero pauses, zero left-app
  ├── conscientiousness → high score, minimal interruptions
  ├── steadiness     → completed, moderate interruptions
  └── influence      → early stop or high distraction

XP Calculation
  └── baseXP × qualityMultiplier + streak bonus
```

After scoring: writes `sessions` row → updates `pets.xp` / `pets.level` → returns full result object to client.

### 3. Micro-Reflection Form

**File:** `app/(app)/reflection.tsx`

Post-session form surfaced automatically after the timer ends:
- **Distraction tag picker** — horizontally scrollable pill chips (社群媒體, 手機通知, 思緒紛飛, …)
- **Completion slider** — custom `ScrollView`-based gesture slider (0–100%)
- **Mood rating** — 5-point emoji scale
- Form data is merged with timer behavioral data before calling `session-complete`

### 4. Analysis Card

**File:** `app/(app)/analysis.tsx`

- Quality Score drives a full-screen `LinearGradient` background (green → amber → red spectrum)
- SVG arc gauge visualizing the score
- Tagline and emoji dynamically chosen from score band
- **Share feature**: `react-native-view-shot` captures the card as PNG → `expo-sharing` opens the native share sheet
- No DISC type label shown on single-session view (DISC is a multi-session aggregate concept)

### 5. Pet System

**Files:** `constants/pets.ts` · `components/pets/` · `stores/petStore.ts`

Four pets, each with a handcrafted React Native vector/3D component:

| Pet | Trait | Accent |
|-----|-------|--------|
| Sunion | Round & cheerful | `#FABD03` |
| Lily | Bright & blooming | `#e03060` |
| Fluff | Soft & dreamy | `#4ecdc4` |
| Stay | Calm & starry | `#C4A8E8` |

- `PetRenderer` component selects between `CustomComponent` (vector) and image fallback
- Active pet persisted to `AsyncStorage`; restored across sessions by matching name
- Pets are created server-side when a user registers (Supabase DB trigger)
- XP bar animation on Reward screen shows before → after transition; raw XP values are hidden from all other screens per product spec

### 6. Stats & DISC Dashboard

**File:** `app/(app)/stats.tsx`

- **Line chart** — 7-day focus hours with tap-to-select day detail, built with `react-native-svg` `Polyline` + filled `Polygon` area
- **Radar chart** — 4-axis DISC spider web (Dominance · Influence · Steadiness · Conscientiousness) built with SVG polygons
- **Recent sessions list** — task name, time-of-day label, XP earned; tapping navigates to the full Analysis card
- Data sourced from `sessionStore` with stale-cache bypass

### 7. Calendar Heatmap

**File:** `components/FocusCalendar.tsx`

- GitHub-style dot grid rendered entirely in pure React Native `View` (no external chart lib)
- Color intensity driven by `total_focus_sec` per day
- Tap a day → navigates to `day-log` accordion screen
- Month-navigation arrows with animated transition

### 8. Auth Flow

**Files:** `app/(auth)/`

Full Supabase email-OTP auth pipeline:
1. **Signup** → sends 6-digit OTP via Supabase Auth
2. **Verify** → independent 10-second rate-limit cooldown on both Verify and Resend buttons
3. **Profile** → username setup
4. **Pet selection** → onboarding pet choice persisted to `AsyncStorage`
5. **Consent** → privacy terms
6. **Done** → transitions to home

Route guard in `app/_layout.tsx` redirects unauthenticated users to `/(auth)` and authenticated users to `/(app)/home`.

---

## CI/CD Pipeline

```
Push / PR → GitHub Actions
  ├── TypeScript Check (ci.yml)
  │     └── npm ci → tsc --noEmit → ✅ 0 errors
  └── EAS Build (eas-build.yml)
        ├── PR  → iOS preview build (non-blocking, --no-wait)
        └── main → Android production build (non-blocking, --no-wait)
```

- Supabase Preview environments via the official Supabase GitHub integration
- `tsconfig.json` excludes `supabase/functions/**` (Deno runtime) and `__tests__/**` (Jest) from the Node tsc pass

---

## Design System

All screens share a consistent **Liquid Glass / Frosted Card** aesthetic:

- `AppBackground` — animated soft gradient base layer
- `FrostCard` — blurred frosted glass card container (configurable radius + padding)
- `FocoBar` — top navigation bar with optional back button and avatar
- `Colors` token set: `ink`, `inkSoft`, `inkFaint`, `pinkHot`, `pinkText`, `beige`, `softBg`
- `Fraunces_500Medium` serif for all display headings; system sans-serif for body

Sound design: 5 discrete sound effects (`tap`, `toggle`, `transition_up`, `transition_down`, `type`) dispatched through a global `SoundProvider` context using `expo-av`.

---

## Metrics & Scale

| Metric | Value |
|--------|-------|
| Total source lines (app + components + stores) | ~8,300 |
| Screens | 15 (8 app · 7 auth) |
| Supabase DB migrations | 7 |
| Edge Functions | 1 (`session-complete`) |
| Pet characters (custom vector components) | 4 |
| GitHub Actions workflows | 2 (CI typecheck · EAS build) |

---

## What I Learned

- **Full product ownership** — made every call from data model to animation easing curve to CI configuration; no team to delegate to
- **Backend-for-frontend pattern** — keeping scoring logic server-side forced me to think carefully about the client/server contract and what trust boundary means in a mobile context
- **Reanimated worklet mental model** — the distinction between JS-thread and UI-thread is non-obvious; getting the slider to feel native required understanding `runOnJS` and `'worklet'` directives at a conceptual level, not just copy-pasting examples
- **Stale cache vs. real-time** — for a focus app, slightly stale stats are acceptable; designing the 5-minute window made me think about when "good enough freshness" is actually the right product decision

---

*Last updated: May 2026*
