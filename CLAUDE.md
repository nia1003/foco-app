# FOCO — Project Memory

## Tech Stack
- **Framework**: Expo SDK 54, Expo Router v6, React Native 0.81
- **State**: Zustand (`authStore`, `petStore`, `usePetStore`)
- **Backend**: Supabase (DB + Edge Functions)
- **Styling**: Custom `Colors` / `Spacing` / `Radius` tokens in `constants/theme.ts`; Fraunces font for headings
- **Worktree branch**: active feature work lives in `.claude/worktrees/`

## Design Principles
- XP values are **backend-only** — never show raw XP numbers to users anywhere except the pet level-up progress bar animation (before → after)
- No DISC type labels on single-session views; DISC is a multi-session aggregate (Stats page only)
- Quality score drives all single-session result UI (gradient, color, tagline)
- Liquid Glass / frosted-card aesthetic throughout; `AppBackground` + `FrostCard` as base

---

## Ultimate Product Roadmap

> Source: product architecture map (image, May 2026)

### User Flow Stages

```
1. 初始與登入 → 2. 任務設定 → 3. 專注執行 → 4. 微反思結算 → 5. 遊戲化回饋 → 6. 數據洞察
```

---

### MVP 優先實作

| Stage | Features |
|-------|----------|
| **1. 初始與登入** | 填寫暱稱與初始問卷（身分/痛點）<br>選擇初始共生彩蛋<br>同意隱私權與資料授權條款 |
| **2. 任務設定** | 輸入本輪專注目標<br>選擇番茄鐘或自訂時長 |
| **3. 專注執行** | 開始、暫停、結束計時<br>背景執行與時間推播提醒<br>放棄任務機制 |
| **4. 微反思結算** | 計時結束自動彈出表單<br>點選預設分心原因標籤<br>完成度滑桿與情緒感受評分 |
| **5. 遊戲化回饋** | 依專注與反思結果發放基礎資源<br>顯示寵物基礎成長與狀態變化（進度條動畫） |
| **6. 數據洞察** | 每日/每週專注時長紀錄<br>分心原因分佈統計 |

---

### 進階功能

| Stage | Features |
|-------|----------|
| **1. 初始與登入** | Google/Apple 第三方快捷登入<br>寵物口吻的自訂推播通知設定<br>深淺色模式 (Dark/Light Mode) 切換<br>一鍵清除所有雲端行為數據 |
| **2. 任務設定** | 支援自然語言輸入與 NLP 初步標籤化 |
| **3. 專注執行** | 無網路狀態下的離線快取機制 |
| **4. 微反思結算** | 填寫自訂分心選項與文字反思 |
| **5. 遊戲化回饋** | 結合 Generative AI 根據資源合成獨一無二技能徽章<br>拖曳資源放入合成爐的動畫互動 |
| **6. 數據洞察** | 針對分心熱點給予系統智能建議<br>過去任務詳細資料瀑布時間軸<br>將寵物數據打包成 JSON-LD/Prompt 匯出給 LLM<br>匯出 CSV/Excel 原始數據 |

---

## Current Implementation Status (May 2026)

### ⚠️ Pending DB Deploy
Run before testing reflection form:
```bash
supabase db push   # applies 20260518000001_reflection_fields.sql
supabase functions deploy session-complete   # Edge Function must accept new fields
```

### ✅ Done
- Auth flow (Supabase email login, authStore)
- Home tab as default (`initialRouteName="home"`)
- Pet carousel on Home (multi-pet, XP bar, level)
- Focus timer with pause/resume/quit, pet visual matches selected pet
- `DurationSlider` tap-to-type-in input
- `FocusSetupModal` unified flow (shared between Home + Missions)
- Session complete → Reward → Analysis pipeline
- Analysis card: quality-score-based gradient (no DISC on single session)
- Stats page: DISC radar (aggregate), recent sessions show task name + time-of-day
- Calendar heatmap on Home (GitHub-style dots, tap → day-log)
- Day-log accordion screen (Mon–Sun sessions, swipe to navigate weeks)
- Supabase service: `getCalendarData`, `getWeekSessions`

### 🔲 Next Up (MVP gaps)
- Onboarding flow: nickname form, pet egg selection, privacy consent screens
- Route guard: unauthenticated → `(auth)`, authenticated → `/(app)/home`
- Reflection form after focus: distraction label picker + completion slider
- Pet XP progress bar animation (before → after) on Reward screen — hide raw XP
- Remove XP numbers from all non-pet-level-up UI (stats session rows, analysis card, day-log cards)
- Push notifications (background timer reminder)
- Distraction reason stats on Stats page

### 🔲 Advanced (post-MVP)
- Google/Apple SSO
- NLP task label tagging
- Offline cache
- Custom distraction text input
- AI badge synthesis (Generative AI + resource system)
- Data export (CSV / JSON-LD)
