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

```bash
npm install
npx expo start
```

## CI/CD

詳見 [CI-CD.md](./CI-CD.md)。
