# FOCO Frontend Guideline
## 基於 `foco-app` 現況的精準實作指引

> 這份文件是讀完整個 repo 後寫的。**不是從零開始教**，而是告訴你：哪些已經很好、哪些要改、怎麼改。

---

## 一、現況盤點

### ✅ 已有且品質好的（不用動）

| 檔案 | 現況說明 |
|------|---------|
| `components/ui/*` | FrostCard、AppBackground、CircularTimer、GlassCard 等 UI 元件，保留 |
| `components/layout/*` | FocoBar、TabBar、AppHeader，保留 |
| `constants/theme.ts` | 色票（ink、pinkHot、softBg 等）完整，保留 |
| `constants/pets.ts` | 5 隻寵物定義 + 圖片 require，保留 |
| `assets/pets/` | bean/fluff/jelly/spirit/spike 圖片，保留 |
| `app/(auth)/index.tsx` | Welcome 頁 UI 漂亮，保留 |
| `app/(auth)/signup.tsx` | 名字輸入步驟，保留 |
| `app/(app)/home.tsx` | UI 架構好，只需接真實資料 |
| `app/(app)/stats.tsx` | UI 架構好，只需接真實資料 |
| `app/(app)/focus.tsx` | UI 好，需擴充追蹤邏輯 |
| `hooks/useTimer.ts` | timestamp-based FSM + AppState 同步，架構正確，需擴充 |

### ❌ 需要改動的

| 檔案 | 問題 | 誰改 |
|------|------|------|
| `services/authService.ts` | 呼叫自訂 `/auth/login` endpoint，需改成 Supabase Auth | 亮節 |
| `stores/authStore.ts` | 用 SecureStore 存 JWT，需改成 Supabase session | 亮節 |
| `types/index.ts` | Pet 型別錯（有 happiness/hunger），缺 SessionPayload、SessionResult | 全體 |
| `services/gameService.ts` | Farm/Backpack 的 API，需加 FOCO session/pet/task API | 艾蓁 |
| `stores/userStore.ts` | Pet 型別需更新，XP 邏輯要改 | 曉蓮 |
| `hooks/useTimer.ts` | 缺 pause_count、left_app_count 等 FOCO 追蹤欄位 | 禹丞 |
| `app/(app)/_layout.tsx` | 現在是 Stack，應改成 Tab Navigator | 禹丞 |
| `constants/config.ts` | TOKEN_KEY 是 `farmpet_auth_token`，需更新 | 亮節 |

### ❌ 需要新建的

| 檔案 | 負責人 |
|------|--------|
| `lib/supabase.ts` | 亮節 |
| `app/(app)/reward.tsx` | 禹丞 |
| `app/(app)/analysis.tsx` | 靖雯 |
| `app/(app)/pet-info.tsx` | 曉蓮 |
| `data/mockData.ts` | 全體（後端未好前用） |

---

## 二、第一步：安裝 Supabase（亮節）

```bash
cd foco-app
npx expo install @supabase/supabase-js
```

建立 `lib/supabase.ts`：

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

在 `foco-app/` 根目錄建 `.env`（加進 `.gitignore`！）：
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 三、Types 更新（全體依賴，優先完成）

**直接在現有 `types/index.ts` 末尾追加**，不要刪掉舊的（其他地方還在用）：

```typescript
// ── FOCO 新增型別 ─────────────────────────────
// 加在 types/index.ts 末尾

export type FocusType = 'conscientiousness' | 'dominance' | 'steadiness' | 'influence'

// FOCO 的 Pet（注意：與舊的 Pet interface 不同，這是 Supabase 版本）
export interface FocoPet {
  id: string
  owner_id: string
  name: string
  level: number        // 1–5
  xp: number
  xp_next_level: number
}

// Task
export interface Task {
  id: string
  user_id: string
  title: string
  duration_min: number
  status: 'pending' | 'done'
  created_at: string
}

// Session 歷史
export interface SessionRecord {
  id: string
  actual_duration: number
  completed: boolean
  focus_type_result: FocusType
  xp_earned: number
  ended_at: string
}

// POST session-complete 的 request body
export interface SessionPayload {
  user_id: string
  task_id: string | null
  planned_duration: number
  actual_duration: number
  pause_count: number
  pause_total_sec: number
  left_app_count: number
  left_app_total_sec: number
  completed: boolean
  early_stop: boolean
  started_at: string
}

// Edge Function 回傳
export interface SessionResult {
  session_id: string
  xp_gained: number
  new_xp: number
  new_level: number
  level_up: boolean
  focus_type: FocusType
  xp_next_level: number
}

// Timer 追蹤用的快照
export interface TimerSnapshot {
  plannedDuration: number
  startedAt: number       // Date.now()
  pauseCount: number
  pauseTotalSec: number
  leftAppCount: number
  leftAppTotalSec: number
  taskId: string | null
}
```

---

## 四、Auth 系統遷移（亮節）

### 4.1 改寫 `stores/authStore.ts`

把 SecureStore JWT 換成 Supabase session：

```typescript
// stores/authStore.ts — 完整替換
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  userId: string | null
  userEmail: string | null

  restoreSession: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  userEmail: null,

  restoreSession: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({
      isAuthenticated: !!session,
      userId: session?.user.id ?? null,
      userEmail: session?.user.email ?? null,
      isLoading: false,
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        isAuthenticated: !!session,
        userId: session?.user.id ?? null,
        userEmail: session?.user.email ?? null,
      })
    })
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ isAuthenticated: false, userId: null, userEmail: null })
  },
}))
```

### 4.2 改寫 `services/authService.ts`

```typescript
// services/authService.ts
import { supabase } from '@/lib/supabase'

export const authService = {
  signup: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },  // Supabase Trigger 會讀這個
    })
    if (error) throw error
    return data
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
}
```

### 4.3 `app/(auth)/login.tsx`（靖雯，如果尚未完成）

```typescript
import { authService } from '@/services/authService'

const handleLogin = async () => {
  try {
    setLoading(true)
    await authService.login(email, password)
    // onAuthStateChange 會自動觸發，_layout.tsx 路由守衛自動跳轉
  } catch (err: any) {
    Alert.alert('登入失敗', err.message)
  } finally {
    setLoading(false)
  }
}
```

### 4.4 Signup 流程（靖雯）

`signup.tsx` → 輸入 name → 按 Continue → `profile.tsx` → 選 email/password + goals → 呼叫 signup

```typescript
// profile.tsx 內
const { name } = useLocalSearchParams<{ name: string }>()

const handleSignup = async () => {
  await authService.signup(email, password, name)
  // 自動觸發路由守衛 → Home
}
```

`signup.tsx` 的 Continue 按鈕：
```typescript
router.push({ pathname: '/(auth)/profile', params: { name } })
```

---

## 五、`hooks/useTimer.ts` 擴充（禹丞）

現有 `useTimer.ts` 架構很好，但缺少 FOCO 需要的追蹤資料。**擴充而不是重寫**：

```typescript
// 在現有 useTimer.ts 中新增以下 refs 和回傳值

// 在 const [paused, setPaused] 下方加入：
const pauseCountRef = useRef(0)
const pauseTotalSecRef = useRef(0)
const pauseStartRef = useRef<number | null>(null)

const leftAppCountRef = useRef(0)
const leftAppTotalSecRef = useRef(0)
const leaveAppAtRef = useRef<number | null>(null)

const startedAtRef2 = useRef<number | null>(null) // 計時開始的 wall-clock time
const taskIdRef = useRef<string | null>(null)
const plannedDurationRef = useRef(durationSeconds)

// 在 start() 裡加：
//   startedAtRef2.current = Date.now()
//   plannedDurationRef.current = durationSeconds
//   pauseCountRef.current = 0
//   pauseTotalSecRef.current = 0
//   leftAppCountRef.current = 0
//   leftAppTotalSecRef.current = 0

// 在 pause() 裡加：
//   pauseCountRef.current += 1
//   pauseStartRef.current = Date.now()

// 在 resume() 裡加：
//   if (pauseStartRef.current) {
//     pauseTotalSecRef.current += (Date.now() - pauseStartRef.current) / 1000
//     pauseStartRef.current = null
//   }

// 在 AppState 'active' handler 裡加：
//   if (leaveAppAtRef.current) {
//     leftAppCountRef.current += 1
//     leftAppTotalSecRef.current += (Date.now() - leaveAppAtRef.current) / 1000
//     leaveAppAtRef.current = null
//   }

// 在 AppState 'background'/'inactive' handler 裡加：
//   leaveAppAtRef.current = Date.now()

// 新增 getSnapshot() 函式，讓 focus.tsx 在結束時呼叫：
const getSnapshot = useCallback((): TimerSnapshot => {
  return {
    plannedDuration: plannedDurationRef.current,
    startedAt: startedAtRef2.current ?? Date.now(),
    pauseCount: pauseCountRef.current,
    pauseTotalSec: pauseTotalSecRef.current,
    leftAppCount: leftAppCountRef.current,
    leftAppTotalSec: leftAppTotalSecRef.current,
    taskId: taskIdRef.current,
  }
}, [])

// return 裡補上：
// getSnapshot,
// setTaskId: (id: string | null) => { taskIdRef.current = id }
```

完整的修改版 `useTimer.ts` 請直接在檔案裡加，不要刪掉原有邏輯。

---

## 六、`app/(app)/_layout.tsx` → 改成 Tab（禹丞）

```typescript
// app/(app)/_layout.tsx
import { Tabs } from 'expo-router'
import { TabBar } from '@/components/layout/TabBar'
import { Colors } from '@/constants/theme'

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}  // 用現有 TabBar 元件
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"     options={{ title: 'Home' }} />
      <Tabs.Screen name="missions" options={{ title: 'Missions' }} />
      <Tabs.Screen name="stats"    options={{ title: 'Stats' }} />
      {/* 不顯示在 tab bar 的頁面 */}
      <Tabs.Screen name="focus"    options={{ href: null }} />
      <Tabs.Screen name="reward"   options={{ href: null }} />
      <Tabs.Screen name="analysis" options={{ href: null }} />
      <Tabs.Screen name="pet-info" options={{ href: null }} />
    </Tabs>
  )
}
```

> 注意：現有 TabBar 元件在各頁面底部 `<TabBar />` 手動渲染，改成 Tabs layout 後要把頁面裡的 `<TabBar />` 手動呼叫拿掉。

---

## 七、`app/(app)/focus.tsx` 擴充（禹丞）

現有的 focus.tsx UI 很好，核心要做的是：

1. **接收 durationMin 參數**：`useLocalSearchParams`
2. **接通擴充後的 useTimer**：傳入 durationSeconds
3. **結束時送出 session**：呼叫 `completeSession()`
4. **導向 reward**：帶 `result` JSON

```typescript
// focus.tsx 的主要修改點

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTimer } from '@/hooks/useTimer'
import { useAuthStore } from '@/stores/authStore'
import { completeSession } from '@/services/focoService'
import type { SessionPayload } from '@/types'

export default function FocusScreen() {
  const router = useRouter()
  const { durationMin = '25', taskId } = useLocalSearchParams<{
    durationMin?: string
    taskId?: string
  }>()
  const { userId } = useAuthStore()

  const durationSeconds = Number(durationMin) * 60

  const { phase, secs, paused, mm, ss, progress,
          start, pause, resume, skipToReflection,
          getSnapshot, setTaskId } = useTimer({
    durationSeconds,
    onComplete: () => handleEnd(false),
  })

  useEffect(() => {
    setTaskId(taskId ?? null)
    start()  // 進頁面就自動開始
  }, [])

  const handleEnd = async (earlyStop: boolean) => {
    const snap = getSnapshot()
    const now = Date.now()
    const actualDuration = Math.round(
      (now - snap.startedAt) / 1000 - snap.pauseTotalSec - snap.leftAppTotalSec
    )
    const completed = actualDuration >= snap.plannedDuration * 0.9

    const payload: SessionPayload = {
      user_id: userId!,
      task_id: snap.taskId,
      planned_duration: snap.plannedDuration,
      actual_duration: Math.max(actualDuration, 0),
      pause_count: snap.pauseCount,
      pause_total_sec: Math.round(snap.pauseTotalSec),
      left_app_count: snap.leftAppCount,
      left_app_total_sec: Math.round(snap.leftAppTotalSec),
      completed,
      early_stop: earlyStop && !completed,
      started_at: new Date(snap.startedAt).toISOString(),
    }

    try {
      const result = await completeSession(payload)
      router.replace({
        pathname: '/(app)/reward',
        params: { result: JSON.stringify(result) },
      })
    } catch (e) {
      // 後端未好時 fallback mock
      const { mockSessionResult } = await import('@/data/mockData')
      router.replace({
        pathname: '/(app)/reward',
        params: { result: JSON.stringify(mockSessionResult) },
      })
    }
  }

  // 提前放棄按鈕：
  // <TouchableOpacity onPress={() => {
  //   skipToReflection()
  //   handleEnd(true)
  // }} />
}
```

### `home.tsx` 的 Start Focus 按鈕（曉蓮）

```typescript
// home.tsx 裡，把現有的 router.push('/(app)/focus') 改成：
router.push({
  pathname: '/(app)/focus',
  params: { durationMin: String(selectedMin) }  // selectedMin 是 chip 選的分鐘數
})
```

---

## 八、新建 `services/focoService.ts`（艾蓁）

不要動現有的 `gameService.ts`，另建一個 FOCO 專用的：

```typescript
// services/focoService.ts
import { supabase } from '@/lib/supabase'
import type { SessionPayload, SessionResult, FocoPet, Task } from '@/types'

// ── session-complete（呼叫 Edge Function）────────
export async function completeSession(payload: SessionPayload): Promise<SessionResult> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/session-complete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    }
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── getPet ────────────────────────────────────────
export async function getPet(userId: string): Promise<FocoPet> {
  const { data, error } = await supabase
    .from('pets')
    .select('id, owner_id, name, level, xp')
    .eq('owner_id', userId)
    .single()
  if (error) throw error

  const THRESHOLDS = [0, 100, 250, 500, 900]
  return { ...data, xp_next_level: data.level < 5 ? THRESHOLDS[data.level] : 900 }
}

// ── getSessions ───────────────────────────────────
export async function getSessions(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, actual_duration, completed, focus_type_result, xp_earned, ended_at')
    .eq('user_id', userId)
    .order('ended_at', { ascending: false })
  if (error) throw error

  const totalFocusSec = data.reduce((s: number, r: any) => s + r.actual_duration, 0)
  const streakDays = calcStreak(data.map((r: any) => r.ended_at))

  return {
    sessions: data,
    summary: {
      total_focus_sec: totalFocusSec,
      streak_days: streakDays,
      total_sessions: data.length,
    },
  }
}

function calcStreak(endedAtList: string[]): number {
  if (!endedAtList.length) return 0
  const days = [...new Set(endedAtList.map(d => d.slice(0, 10)))].sort().reverse()
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i-1]).getTime() - new Date(days[i]).getTime()) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

// ── Tasks ─────────────────────────────────────────
export async function getTasks(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, user_id, title, duration_min, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return { tasks: data as Task[] }
}

export async function createTask(userId: string, title: string, durationMin: number) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, title, duration_min: durationMin })
    .select()
    .single()
  if (error) throw error
  return data as Task
}
```

---

## 九、`data/mockData.ts`（全體使用）

```typescript
// data/mockData.ts
import type { SessionResult, FocoPet, SessionRecord, Task } from '@/types'

export const mockSessionResult: SessionResult = {
  session_id: 'mock-001',
  xp_gained: 50,
  new_xp: 180,
  new_level: 2,
  level_up: true,
  focus_type: 'conscientiousness',
  xp_next_level: 250,
}

export const mockPet: FocoPet = {
  id: 'mock-pet-001',
  owner_id: 'mock-user-001',
  name: 'Bean',
  level: 2,
  xp: 180,
  xp_next_level: 250,
}

export const mockSessions = {
  sessions: [
    { id: 's001', actual_duration: 1423, completed: true,
      focus_type_result: 'dominance' as const, xp_earned: 30,
      ended_at: '2025-05-15T10:30:00Z' },
    { id: 's002', actual_duration: 890, completed: false,
      focus_type_result: 'influence' as const, xp_earned: 5,
      ended_at: '2025-05-14T09:00:00Z' },
  ],
  summary: { total_focus_sec: 12400, streak_days: 3, total_sessions: 8 },
}

export const mockTasks = {
  tasks: [
    { id: 't001', user_id: 'u001', title: '讀書30頁',
      duration_min: 25, status: 'pending' as const, created_at: '' },
    { id: 't002', user_id: 'u001', title: '寫作業',
      duration_min: 50, status: 'done' as const, created_at: '' },
  ],
}
```

---

## 十、新建頁面

### 10.1 `app/(app)/reward.tsx`（禹丞）

```typescript
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Animated, Text, TouchableOpacity, View } from 'react-native'
import type { SessionResult } from '@/types'
import { usePetStore } from '@/stores/petStore'  // 見下文

export default function RewardScreen() {
  const router = useRouter()
  const { result: resultStr } = useLocalSearchParams<{ result: string }>()
  const result: SessionResult = JSON.parse(resultStr ?? '{}')
  const { applyResult } = usePetStore()

  // 進頁面就更新 pet store
  useEffect(() => {
    applyResult(result.new_xp, result.new_level)
  }, [])

  // XP 跳動動畫
  const xpAnim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.spring(xpAnim, { toValue: 1, useNativeDriver: true }).start()
  }, [])

  return (
    <View style={{ flex: 1 }}>
      {/* +XP 數字 */}
      <Animated.Text style={{ transform: [{ scale: xpAnim }] }}>
        +{result.xp_gained} XP
      </Animated.Text>

      {/* 升級動畫 */}
      {result.level_up && <Text>🎉 Level Up! Lv.{result.new_level}</Text>}

      {/* XP bar */}
      <View style={{ width: `${(result.new_xp / result.xp_next_level) * 100}%` }} />

      <TouchableOpacity onPress={() => router.push({
        pathname: '/(app)/analysis',
        params: { result: resultStr }
      })}>
        <Text>查看報告</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### 10.2 `app/(app)/analysis.tsx`（靖雯）

```typescript
// DISC 對照表
const DISC_INFO = {
  conscientiousness: { emoji: '🔵', label: 'Conscientiousness 謹慎型', desc: '精準、有條理，完美執行！' },
  dominance:         { emoji: '🔴', label: 'Dominance 主導型',         desc: '目標導向、高完成率，勇往直前！' },
  steadiness:        { emoji: '🟢', label: 'Steadiness 穩健型',        desc: '節奏穩定、踏實推進，細水長流！' },
  influence:         { emoji: '🟡', label: 'Influence 影響型',          desc: '彈性十足、靈活應變，熱情滿滿！' },
}

// 分享功能（需要安裝 react-native-view-shot + expo-sharing）
// npx expo install react-native-view-shot expo-sharing expo-media-library
import ViewShot from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import * as MediaLibrary from 'expo-media-library'

const viewShotRef = useRef<ViewShot>(null)

const handleShare = async () => {
  const uri = await viewShotRef.current?.capture?.()
  if (uri) await Sharing.shareAsync(uri)
}

const handleSave = async () => {
  const [perm] = await MediaLibrary.requestPermissionsAsync()
  if (!perm.granted) return
  const uri = await viewShotRef.current?.capture?.()
  if (uri) await MediaLibrary.saveToLibraryAsync(uri)
}
```

### 10.3 `app/(app)/pet-info.tsx`（曉蓮）

```typescript
import { usePetStore } from '@/stores/petStore'
import { PETS } from '@/constants/pets'

// 等級對應 scale（靜態圖 + transform）
const PET_SCALE = { 1: 0.7, 2: 0.85, 3: 1.0, 4: 1.1, 5: 1.2 }

export default function PetInfoScreen() {
  const { pet } = usePetStore()
  if (!pet) return null

  // 對應到 PETS 陣列中的圖片
  const petDef = PETS.find(p => p.id === pet.name.toLowerCase()) ?? PETS[0]

  return (
    <View>
      <Image
        source={petDef.image}
        style={{ transform: [{ scale: PET_SCALE[pet.level as 1|2|3|4|5] ?? 1 }] }}
      />
      <Text>Lv.{pet.level} — {pet.xp} / {pet.xp_next_level} XP</Text>
      {/* XP bar */}
    </View>
  )
}
```

---

## 十一、新建 `stores/petStore.ts`（曉蓮）

```typescript
// stores/petStore.ts
import { create } from 'zustand'
import type { FocoPet } from '@/types'

interface PetStore {
  pet: FocoPet | null
  setPet: (pet: FocoPet) => void
  applyResult: (newXP: number, newLevel: number) => void
}

export const usePetStore = create<PetStore>((set) => ({
  pet: null,
  setPet: (pet) => set({ pet }),
  applyResult: (newXP, newLevel) =>
    set((state) => ({
      pet: state.pet
        ? { ...state.pet, xp: newXP, level: newLevel }
        : null,
    })),
}))
```

---

## 十二、`home.tsx` 接真實資料（曉蓮）

```typescript
// home.tsx 新增：
import { usePetStore } from '@/stores/petStore'
import { useAuthStore } from '@/stores/authStore'
import { getPet } from '@/services/focoService'
import { mockPet } from '@/data/mockData'

const { userId } = useAuthStore()
const { pet, setPet } = usePetStore()
const [selectedMin, setSelectedMin] = useState(25)

useEffect(() => {
  if (!userId) return
  getPet(userId)
    .then(setPet)
    .catch(() => setPet(mockPet))  // 後端未好就用 mock
}, [userId])

// 現有的 petCard 區塊，把 hardcode 的 'Mochi · Lv. 3' 換成：
// {pet?.name} · Lv. {pet?.level}
// XP bar: width: `${(pet.xp / pet.xp_next_level) * 100}%`

// Duration chip（在 startBtn 上方加）：
const DURATIONS = [15, 25, 50, 90]
{DURATIONS.map(min => (
  <TouchableOpacity key={min} onPress={() => setSelectedMin(min)}
    style={[styles.chip, selectedMin === min && styles.chipActive]}>
    <Text>{min}m</Text>
  </TouchableOpacity>
))}

// Start Focus 按鈕 onPress 改成：
router.push({ pathname: '/(app)/focus', params: { durationMin: String(selectedMin) } })
```

---

## 十三、`stats.tsx` 接真實資料（靖雯）

```typescript
import { getSessions } from '@/services/focoService'
import { useAuthStore } from '@/stores/authStore'
import { mockSessions } from '@/data/mockData'

const { userId } = useAuthStore()
const [sessionsData, setSessionsData] = useState(mockSessions)  // 先用 mock

useEffect(() => {
  if (!userId) return
  getSessions(userId)
    .then(setSessionsData)
    .catch(() => {}) // 保持 mock
}, [userId])

// summary row 換成真實資料：
// total_focus_sec → 格式化成「X.Xh」
// streak_days → 連續天數
// total_sessions → session 數

function formatHours(sec: number): string {
  return `${(sec / 3600).toFixed(1)}h`
}
```

---

## 十四、Mock → Real API 切換原則

後端好了，**只需要移除 `.catch(() => setPet(mockPet))` 那行**，讓 error 真的拋出去，或移除整個 fallback。

---

## 十五、分工快速對照

| 誰 | 這週要做的事 |
|----|------------|
| **亮節** | `lib/supabase.ts`、改 `authStore.ts`、改 `authService.ts`、`.env` 金鑰、測試 signup/login 跑通 |
| **禹丞** | 改 `(app)/_layout.tsx` → Tabs、擴充 `useTimer.ts`（追蹤欄位）、改 `focus.tsx`（接收 params + POST）、新建 `reward.tsx` |
| **曉蓮** | 新建 `stores/petStore.ts`、改 `home.tsx`（chip + 真實 pet 資料）、新建 `pet-info.tsx` |
| **靖雯** | 完成 `login.tsx`、`profile.tsx` 的 auth 串接、新建 `analysis.tsx`（DISC 報告 + 分享）、改 `stats.tsx`（真實資料） |
| **艾蓁** | 新建 `services/focoService.ts`（四支函式）、改 `missions/index.tsx`（串接 getTasks/createTask） |
| **子寰** | Edge Function（見後端 Guideline） |

---

## 十六、安裝缺少的套件

```bash
cd foco-app

# Supabase（最重要）
npx expo install @supabase/supabase-js

# Analysis 頁面分享功能
npx expo install react-native-view-shot expo-sharing expo-media-library
```

---

*Last updated: Week 13 — 基於 foco-app repo 現況*
