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

## 寵物 XP 系統

### 基礎 XP（依實際專注時長）

| 實際時長 | 基礎 XP |
|---------|--------|
| 15 分鐘以下 | +5 |
| 15–30 分鐘 | +15 |
| 30–60 分鐘 | +30 |
| 60 分鐘以上 | +50 |

### 加分

- 完成目標時長：+10 XP

### 折扣

- 有暫停：× 0.95（減 5%）
- 有切出 App：× 0.90（減 10%）
- 提前放棄（early_stop）：只給基礎 XP，不計加分與折扣

> 折扣可疊加，計算結果四捨五入。

### 升級門檻

| 等級 | 累計 XP |
|------|--------|
| Lv.1 | 0 |
| Lv.2 | 100 |
| Lv.3 | 250 |
| Lv.4 | 500 |
| Lv.5 | 900（上限） |

## DISC 專注類型

每次計時結束依行為數據判斷風格，僅供參考，不影響 XP。

| 分數 | 類型 |
|------|------|
| 4 | 🔵 Conscientiousness 謹慎型 |
| 3 | 🔴 Dominance 主導型 |
| 2 | 🟢 Steadiness 穩健型 |
| ≤1 | 🟡 Influence 影響型 |

分數計算：完成 +2、未暫停 +1、未切出 App +1。

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

- Node.js 18+
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
npx expo start --clear
```

**4. 在手機上開啟**

- **iOS**：用相機掃 QR Code
- **Android**：在 Expo Go 內掃 QR Code

> ⚠️ 手機與電腦需連同一個 WiFi。若在不同網路，改用 tunnel 模式：
> ```bash
> npx expo start --tunnel --clear
> ```

### 常見問題

| 問題 | 解法 |
|------|------|
| Port 8081 被佔用 | `lsof -ti :8081 \| xargs kill -9` |
| 手機連不上（不同網路） | 改用 `--tunnel` |
| 登入後白畫面 | 確認 `.env` 填寫正確 |
| 登入／API timeout | 確認網路正常；Supabase 專案是否 paused（免費方案閒置會自動暫停） |
| 離線時 App 閃退 | 目前尚未支援離線模式，需保持網路連線 |

## CI/CD

詳見 [CI-CD.md](./docs/CI-CD.md)。
