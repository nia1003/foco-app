# FOCO

專注即成長 — 你的專注讓寵物升級。

## 專案簡介

FOCO 是一款以電子寵物為核心動力的專注 App。每次完成一段計時專注，寵物就會獲得 XP 並升級。讓「去做事」本身變成一種養成遊戲。

## 技術棧

| 項目 | 選用 |
|------|------|
| App 框架 | React Native + Expo SDK 54 |
| 導航 | expo-router v6 |
| 資料庫 | Supabase (PostgreSQL + Edge Functions) |
| 本地儲存 | AsyncStorage |
| 背景偵測 | React Native AppState |
| 截圖分享 | react-native-view-shot + expo-sharing |
| 儲存相簿 | expo-media-library |
| 3D 寵物 | Three.js r128（WebView 渲染） |
| CI/CD | GitHub Actions + EAS Build |

## 評分機制與 XP 系統

### 程式位置

| 用途 | 檔案 |
|------|------|
| 正式計分、XP、DISC、寫入 session、更新 pet | `supabase/functions/session-complete/index.ts` |
| 前端 fallback quality score helper | `lib/sessionScoring.ts` |
| 呼叫 Edge Function 與檢查回傳 reward payload | `services/focoService.ts` |
| 評分穩定性測試 | `__tests__/session-scoring.test.ts` |
| session-complete 回傳契約測試 | `__tests__/foco-service.test.ts` |
| reflection 防重複送出測試 | `__tests__/reflection-submit.test.tsx` |

> Source of truth 是 `supabase/functions/session-complete/index.ts`。前端的 `lib/sessionScoring.ts` 只用在 Edge Function 回傳舊格式或 `quality_score` 異常時的 fallback。

### Quality Score（0–100）

Quality Score 先算本輪完成比例：

- 有 `completion_percent` 時，用反思表單的完成度：`completion_percent / 100`
- 沒有 `completion_percent` 時，用計時比例：`actual_duration / planned_duration`，最高 1.0
- `planned_duration <= 0` 時，視為 1.0

計分公式：

| 條件 | 分數影響 |
|------|----------|
| 基礎分 | `round(completionRatio * 70)` |
| 完成任務 | `+15` |
| 暫停 | 每次 `-5`，最多扣 `20` |
| 切出 App | 每次 `-8`，最多扣 `25` |
| 切出 App 超過 120 秒 | 額外 `-10` |
| 提前放棄 `early_stop` | 直接回傳 `round(completionRatio * 40)` |

最後會 clamp 到 `0–100`。

### XP 計算

XP 先依實際專注時間取得 base：

| 實際時長 | base XP |
|---------|---------|
| 60 分鐘以上 | 60 |
| 45–59 分鐘 | 45 |
| 30–44 分鐘 | 30 |
| 20–29 分鐘 | 20 |
| 10–19 分鐘 | 12 |
| 10 分鐘以下 | 6 |

如果 `early_stop` 為 true，直接回傳 base XP。

否則使用 Quality Score 當乘數：

```ts
multiplier = 0.5 + qualityScore / 100
xpGained = max(round(base * multiplier), 1)
```

也就是：

| Quality Score | XP 乘數 |
|---------------|---------|
| 0 | 0.5x |
| 50 | 1.0x |
| 100 | 1.5x |

### 升級門檻

| 等級 | 累計 XP |
|------|--------|
| Lv.1 | 0 |
| Lv.2 | 100 |
| Lv.3 | 250 |
| Lv.4 | 500 |
| Lv.5 | 900（上限） |

## DISC 專注類型

每次計時結束依完成狀態、中斷次數與 Quality Score 判斷風格。DISC 只作為分析分類；XP 是由 Quality Score 影響。

| 條件 | 類型 |
|------|------|
| completed 且 qualityScore >= 75 | conscientiousness |
| completed 且 pause + leftApp <= 3 | dominance |
| 未 completed 且 pause + leftApp <= 2 | steadiness |
| 其他 | influence |

### 如何測這段

```bash
npm.cmd test -- --runInBand __tests__/session-scoring.test.ts __tests__/foco-service.test.ts __tests__/reflection-submit.test.tsx
```

完整測試：

```bash
npm.cmd test -- --runInBand
```

## 分工

| 人 | 負責 |
|----|------|
| 曉蓮 | UI 設計 + Home、Pet Info 頁面 |
| 靖雯 | UI 設計 + Login、Signup、Analysis、Stats 頁面 |
| 禹丞 | Navigation 架構 + Timer 邏輯 + Reward 頁 |
| 亮節 | Supabase 設定 + Auth + DB Schema |
| 子寰 | Session Edge Function（XP 計算 + DISC 分類） |
| 艾蓁 | Tasks / Sessions / Pets CRUD API |

## 開發啟動

### 前提

- Node.js 20 LTS（Expo SDK 54 建議使用 Node 20/22 LTS；避免使用太新的 Current 版本）
- 手機安裝 **Expo Go**（[iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)）

### 步驟

**1. 安裝套件**

```bash
npm install
```

**2. 設定環境變數**

在根目錄建立 `.env`（不要 commit，向組員索取憑證）：

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJh...
```

**3. 啟動 dev server**

```bash
npx expo start --lan --clear
```

**4. 在手機上開啟**

- **iOS**：用相機掃 QR Code
- **Android**：在 Expo Go 內掃 QR Code

> ⚠️ `--lan` 模式需要手機與電腦連同一個 WiFi。若在不同網路，改用 tunnel 模式：
> ```bash
> npx expo start --tunnel --clear
> ```

### 常見問題

| 問題 | 解法 |
|------|------|
| Port 8081 被佔用 | Windows: `netstat -ano \| findstr :8081` 找 PID 後 `Stop-Process -Id <PID> -Force` |
| 手機連不上（同 WiFi） | 確認手機與電腦在同一網路，或改用 `npx expo start --tunnel --clear` |
| `failed to start tunnel` | 先執行 `Get-Process ngrok -ErrorAction SilentlyContinue \| Stop-Process -Force`，再重跑 tunnel 指令 |
| 登入後白畫面 | 確認 `.env` 填寫正確 |
| 登入／API timeout | 確認網路正常；Supabase 專案是否 paused（免費方案閒置會自動暫停） |
| 離線時 App 閃退 | 目前尚未支援離線模式，需保持網路連線 |

## CI/CD

詳見 [CI-CD.md](./docs/CI-CD.md)。
