# FOCO — 專案完整文件

---

## 一、我們在做什麼

**FOCO 是一個專注 App。**

> 你專注 → 你的寵物獲得 XP → 寵物升級

就像養電子寵物，但動力來自於你真的去做事。

---

## 二、用戶會經歷什麼

```
1. 打開 App，看到自己的寵物在主頁
2. 選要專注幾分鐘（15 / 25 / 50 / 90 分鐘）
3. 開始計時，App 在背景記錄你的狀態
4. 結束後看到這次的分析報告
   → 你的專注類型（DISC）
   → 這次獲得多少 XP
   → 寵物升級了嗎？
5. 可以把報告截圖分享出去
6. 回到主頁，看到寵物又長大了一點
```

---

## 三、頁面清單與跳轉邏輯

```
[Splash]
  ├─ 已登入 ──────────────────→ [Home]
  └─ 未登入
       ├─→ [Login] ──────────→ [Home]
       └─→ [Signup]
             [輸入名字]
               → [輸入 Email / 密碼]
                 → [選擇目標]
                   → [Home]

[Home]
  → 選時長 chip（15 / 25 / 50 / 90 min）
  → 點「Start Focus」→ [Timer]
  → 點寵物 → [Pet Info]
  → Nav: Missions / Stats

[Timer]
  ├─ 暫停 ⇄ 繼續
  ├─ 提前結束 → 確認 modal → [Reward]
  └─ 時間到 ────────────────→ [Reward]
                                   ↓
                             [Analysis]
                                   ↓
                               [Home]

[Missions]
  → 新增任務（輸入名稱 + 時長）
  → 點任務 → [Mission Detail]
               → 開始專注 → [Timer]

[Stats]
  → 顯示歷史紀錄、總時數、連續天數
  → 點某次紀錄 → 查看分析報告

[Pet Info]
  → 顯示等級、XP 進度條、外觀
```

---

## 四、DISC 專注類型分析

每次計時結束，根據行為數據判斷這次的專注風格。

### 記錄哪些數據

| 欄位 | 說明 |
|------|------|
| `planned_duration` | 用戶選擇的時長（秒） |
| `actual_duration` | 實際專注時長 = 總秒數 − 暫停秒數 − 切出秒數 |
| `pause_count` | 暫停次數 |
| `pause_total_sec` | 總暫停時間（秒） |
| `left_app_count` | 切出 App 次數 |
| `left_app_total_sec` | 切出 App 總時間（秒） |
| `completed` | actual_duration ≥ planned × 0.9 |
| `early_stop` | 用戶主動結束 AND !completed |

### DISC 判斷公式

```
focus_score =
  completed == true        → +2 分
  pause_count == 0         → +1 分
  left_app_count == 0      → +1 分

score = 4  → 🔵 Conscientiousness 謹慎型（最專注、最精準）
score = 3  → 🔴 Dominance 主導型（目標導向、高完成率）
score = 2  → 🟢 Steadiness 穩健型（節奏穩定、偶爾暫停）
score ≤ 1  → 🟡 Influence 影響型（彈性大、容易分心）
```

DISC 結果只顯示給用戶看，**不影響 XP 計算**。

---

## 五、寵物系統：XP 與升級

### XP 來源：只有專注完成

**基礎 XP（依實際專注時長）**

| 實際時長 | 基礎 XP |
|---------|--------|
| 15 分鐘以下 | +5 XP |
| 15–30 分鐘 | +15 XP |
| 30–60 分鐘 | +30 XP |
| 60 分鐘以上 | +50 XP |

**加分**
```
有完成目標時長          → +10 XP
計時期間沒有切出 App    → +5 XP
計時期間沒有暫停        → +5 XP
```

**扣分**
```
提前放棄（early_stop）   → 只拿基礎 XP，加分全部取消
暫停超過 3 次            → −5 XP
切出 App 超過 2 次       → −5 XP
切出 App 總時間 > 5 分鐘 → −5 XP
```

### 等級門檻

```
Lv.1  →    0 XP
Lv.2  →  100 XP
Lv.3  →  250 XP
Lv.4  →  500 XP
Lv.5  →  900 XP（上限）
```

---

## 六、分析報告

```
┌──────────────────────────────┐
│  這次專注報告                 │
│                               │
│  ⏱  實際專注   47 分 23 秒   │
│  ⏸  暫停次數   0 次          │
│  📱  切出 App   0 次          │
│                               │
│  🔵 Conscientiousness 謹慎型  │
│  「精準、有條理，完美執行！」   │
│                               │
│  獲得 XP：+50 XP              │
│  （基礎 +30、完成 +10、       │
│   不暫停 +5、不切出 +5）      │
│                               │
│  [分享]  [儲存圖片]           │
└──────────────────────────────┘
```

---

## 七、System Flow（資料流動邏輯）

### Auth 判斷

```
App 開啟
  → 讀 AsyncStorage token
       有 → Supabase 驗證
                有效 → Home
                失效 → 清除 → Login
       沒有 → Splash → Login / Signup
```

### Timer 追蹤（前端 local state）

```
開始計時
  → 初始化 local state：
       { planned_duration, started_at,
         pause_count: 0, pause_total_sec: 0,
         left_app_count: 0, left_app_total_sec: 0 }

計時中：
  AppState → 'background'
    left_app_count += 1
    leave_time = Date.now()
  AppState → 'active'
    left_app_total_sec += Date.now() - leave_time

暫停：
  pause_count += 1
  pause_start = Date.now()
繼續：
  pause_total_sec += Date.now() - pause_start

結束（時間到 or 提前放棄）：
  actual_duration = elapsed - pause_total_sec - left_app_total_sec
  completed = actual_duration >= planned_duration × 0.9
  early_stop = 用戶主動按結束 AND !completed
  → POST session 給後端
```

### 後端：Session 結束處理

```
收到 POST
  → INSERT sessions
  → 計算 focus_score → DISC 類型
  → 計算 XP（基礎 + 加分 - 扣分）
  → UPDATE pets.xp += xp_gained
  → 檢查升級：新 xp >= 下一級門檻？
       YES → UPDATE pets.level += 1，level_up = true
  → 回傳：
       { xp_gained, new_xp, new_level, level_up, focus_type }
```

### 前端：Reward 頁

```
收到回傳
  → 顯示 XP 動畫（+xx XP）
  → XP bar animate 到新數值
  → level_up == true → 升級動畫
  → 「查看報告」→ Analysis
```

### 前端：Analysis 頁

```
資料直接來自 POST 回傳（不需要額外 GET）
  → 顯示：actual_duration、pause_count、left_app_count
  → 顯示：DISC 類型 + 說明文字
  → 顯示：本次獲得 XP 明細

「分享」→ react-native-view-shot → expo-sharing
「儲存」→ expo-media-library
「回首頁」→ Home
```

---

## 八、DB Schema

```sql
users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text UNIQUE NOT NULL,
  goals       text[],
  created_at  timestamp DEFAULT now()
)

pets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  name        text DEFAULT 'Pet',
  level       int  DEFAULT 1,
  xp          int  DEFAULT 0,
  created_at  timestamp DEFAULT now()
)

tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  duration_min int  NOT NULL,
  status       text DEFAULT 'pending',
  created_at   timestamp DEFAULT now()
)

sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES users(id) ON DELETE CASCADE,
  task_id            uuid REFERENCES tasks(id),
  planned_duration   int  NOT NULL,
  actual_duration    int  NOT NULL,
  pause_count        int  DEFAULT 0,
  pause_total_sec    int  DEFAULT 0,
  left_app_count     int  DEFAULT 0,
  left_app_total_sec int  DEFAULT 0,
  completed          boolean DEFAULT false,
  early_stop         boolean DEFAULT false,
  focus_type_result  text,
  xp_earned          int  DEFAULT 0,
  started_at         timestamp,
  ended_at           timestamp DEFAULT now()
)
```

---

## 九、API Contract

### POST `/sessions/complete`（最核心）
Timer 結束時由禹丞呼叫

**Request:**
```json
{
  "user_id": "uuid",
  "task_id": "uuid or null",
  "planned_duration": 1500,
  "actual_duration": 1423,
  "pause_count": 1,
  "pause_total_sec": 45,
  "left_app_count": 0,
  "left_app_total_sec": 0,
  "completed": true,
  "early_stop": false,
  "started_at": "2025-05-15T10:00:00Z"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "xp_gained": 30,
  "new_xp": 180,
  "new_level": 2,
  "level_up": true,
  "focus_type": "conscientiousness"
}
```

---

### GET `/pets?user_id=xxx`
Home、Pet Info 頁載入時呼叫

```json
{
  "id": "uuid",
  "name": "Pet",
  "level": 2,
  "xp": 180,
  "xp_next_level": 250
}
```

---

### GET `/sessions?user_id=xxx`
Stats 頁載入時呼叫

```json
{
  "sessions": [
    {
      "id": "uuid",
      "actual_duration": 1423,
      "completed": true,
      "focus_type_result": "dominance",
      "xp_earned": 30,
      "ended_at": "2025-05-15T10:30:00Z"
    }
  ],
  "summary": {
    "total_focus_sec": 12400,
    "streak_days": 3,
    "total_sessions": 8
  }
}
```

---

### POST `/tasks`

**Request:**
```json
{
  "user_id": "uuid",
  "title": "讀書30頁",
  "duration_min": 25
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "讀書30頁",
  "duration_min": 25,
  "status": "pending"
}
```

---

### GET `/tasks?user_id=xxx`

```json
{
  "tasks": [
    { "id": "uuid", "title": "讀書30頁", "duration_min": 25, "status": "pending" },
    { "id": "uuid", "title": "寫作業",   "duration_min": 50, "status": "done" }
  ]
}
```

---

## 十、Mock Data（後端未完成時前端使用）

```javascript
// mockData.js — 曉蓮、靖雯、禹丞直接 import

export const mockSessionResult = {
  session_id: 'mock-001',
  xp_gained: 30,
  new_xp: 180,
  new_level: 2,
  level_up: true,
  focus_type: 'conscientiousness',
};

export const mockPet = {
  id: 'mock-pet-001',
  name: 'Pet',
  level: 2,
  xp: 180,
  xp_next_level: 250,
};

export const mockSessions = {
  sessions: [
    { id: 's001', actual_duration: 1423, completed: true,
      focus_type_result: 'dominance', xp_earned: 30,
      ended_at: '2025-05-15T10:30:00Z' },
    { id: 's002', actual_duration: 890, completed: false,
      focus_type_result: 'influence', xp_earned: 5,
      ended_at: '2025-05-14T09:00:00Z' },
  ],
  summary: {
    total_focus_sec: 12400,
    streak_days: 3,
    total_sessions: 8,
  },
};

export const mockTasks = {
  tasks: [
    { id: 't001', title: '讀書30頁', duration_min: 25, status: 'pending' },
    { id: 't002', title: '寫作業',   duration_min: 50, status: 'done' },
  ],
};
```

---

## 十一、技術選擇

| 項目 | 選用 |
|------|------|
| App 框架 | React Native + Expo |
| 資料庫 | Supabase |
| 導航 | expo-router |
| 本地儲存 | AsyncStorage |
| 偵測切出 App | React Native AppState（內建，不需另裝） |
| 截圖分享 | react-native-view-shot + expo-sharing |
| 儲存相簿 | expo-media-library |

---

## 十二、分工

| 人 | 負責 |
|----|------|
| 曉蓮 | UI 設計 + Home、Pet Info 頁面 |
| 靖雯 | UI 設計 + Login、Signup、Analysis、Stats 頁面 |
| 禹丞 | Navigation 架構 + Timer 邏輯 + Reward 頁 |
| 亮節 | Supabase 設定 + Auth + DB Schema |
| 子寰 | Session Edge Function（XP 計算 + DISC 分類） |
| 艾蓁 | Tasks / Sessions / pets CRUD API + API 文件維護 |

---

## 十三、三週時程

### Week 13 — 地基（Days 1–5）

| 誰 | 做什麼 | 產出 |
|----|--------|------|
| 禹丞 | 建 Expo 專案、expo-router、所有空白 Screen | 頁面跳轉跑通 |
| 亮節 | 建 Supabase、所有 table、Auth、測試資料 | DB 可以連 |
| 子寰 | 讀懂 XP + DISC 邏輯，規劃 Edge Function 結構 | 設計文件 |
| 曉蓮 | 確認設計系統（色票、字型）、Home + Timer wireframe | Wireframe |
| 靖雯 | Login / Signup / Analysis wireframe | Wireframe |
| 艾蓁 | 整理 API Contract，確認格式給前端 | API 文件 |

**Week 13 目標：** 空白頁面可以跳轉 ＋ Supabase 可以連

---

### Week 14 — 核心功能（Days 6–12）

| 誰 | 做什麼 |
|----|--------|
| 禹丞 | Timer 完整邏輯（計時、暫停、AppState、POST session） |
| 亮節 + 禹丞 | Pipeline 驗證（見下方 Checklist） |
| 子寰 | Session Edge Function 實作完成 |
| 曉蓮 | 切 Home UI（Mock data）、切 Pet Info UI |
| 靖雯 | 切 Login / Signup UI、切 Analysis UI |
| 艾蓁 | GET pets、GET sessions、POST tasks API |

**Week 14 目標：Timer → Supabase → 前端收到 XP 回傳 → Reward 頁顯示**

---

### Week 15 — 補齊收尾（Days 13–21）

| 誰 | 做什麼 |
|----|--------|
| 禹丞 | Reward 頁完整版、升級動畫、測試 |
| 曉蓮 | 寵物等級外觀（scale + 裝飾渲染）、主頁完整版、測試 |
| 靖雯 | Stats 頁、截圖分享功能、測試 |
| 亮節 | Auth 完整流程、修 bug、協助前端接 API、測試 |
| 子寰 | 修 Edge Function bug、驗算 XP 準確性、測試 |
| 艾蓁 | Missions 資料接入、Stats 聚合查詢、測試 |

**Week 15 目標：** 完整走一遍用戶流程，沒有中斷

---

### 三週內不做（砍掉）

| 砍掉的功能 | 理由 |
|-----------|------|
| 3D 寵物動畫 | 用靜態圖片 + scale 代替，省時間 |
| 頁面轉場動畫 | 不影響功能 |
| Missions（如果來不及） | 直接從 Home 選時長也是完整流程 |

---

## 十四、Pipeline 驗證 Checklist（Week 14 末）

亮節 + 禹丞一起跑，全部 ✅ 才算通：

```
□ App 連上 Supabase 不報錯
□ 測試帳號登入成功
□ Token 存進 AsyncStorage
□ 重開 App → 自動進 Home（不用重新登入）
□ Timer 跑完 → POST session 成功
□ Supabase DB 看得到新的 session 紀錄
□ 後端回傳格式與 API Contract 一致
□ Reward 頁顯示正確的 xp_gained 和 focus_type
□ level_up: true 觸發升級動畫
```

---

## 十五、最重要的原則

> **前端不等後端。**
> 後端沒好之前，用 mockData.js 先把 UI 做完。
> 後端好了，換一行 import 就接上去。

---

## 十六、有問題找誰

| 問題 | 找誰 |
|------|------|
| 頁面跳轉 / 架構 | 禹丞 |
| 設計規格 | 曉蓮 |
| Supabase / 連線 | 亮節 |
| XP 計算 / DISC 邏輯 | 子寰 |
| API 格式 | 艾蓁 |
| 不知道找誰 | 先問亮節 |
