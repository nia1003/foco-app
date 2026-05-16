# FOCO — System Design (Final)
> No food system. XP goes directly to the pet from focus sessions.

---

## Core Mechanic (One Sentence)

> You focus → your pet gains XP → your pet levels up.

That's it. No food, no backpack, no feeding step.

---

## 一、XP System

### XP Source: Focus Session Only

```
Base XP (by actual focus duration):
  < 15 min    → +5 XP
  15–30 min   → +15 XP
  30–60 min   → +30 XP
  ≥ 60 min    → +50 XP

Bonus XP:
  completed == true        → +10 XP
  left_app_count == 0      → +5 XP
  pause_count == 0         → +5 XP

Penalty:
  early_stop == true       → base XP only, no bonus
```

### Level Thresholds (Lv.1–5)

```
Lv.1  →    0 XP
Lv.2  →  100 XP
Lv.3  →  250 XP
Lv.4  →  500 XP
Lv.5  →  900 XP  (max)
```

### Visual Changes Per Level

```
Lv.1  scale 100%   no decoration
Lv.2  scale 115%   head accessory unlocked
Lv.3  scale 130%   body pattern unlocked
Lv.4  scale 145%   tail / wings unlocked
Lv.5  scale 160%   full look + special idle animation

Implementation: one base pet model, decorations conditionally rendered on top.
Assets needed: base × 1, head accessory × 1, body pattern × 1, tail × 1 → 4 assets total
```

---

## 二、Focus Tracking

### What Gets Recorded During a Session

| Field | Description |
|-------|-------------|
| `planned_duration` | Duration the user selected (seconds) |
| `actual_duration` | Real focus time (minus pauses and app-away time) |
| `pause_count` | How many times paused |
| `pause_total_sec` | Total time spent paused |
| `left_app_count` | How many times app went to background |
| `left_app_total_sec` | Total time app was in background |
| `completed` | actual ≥ planned × 0.9 |
| `early_stop` | User manually ended AND !completed |

### Focus Type Classification

```
focus_score = completed(+2) + pause_count==0(+1) + left_app_count==0(+1)

score ≥ 3  → Focus type  🔥  ("Goal-driven, locked in")
score ≤ 2  → Flow type   🌿  ("Steady pace, flexible")

→ Stored in sessions.focus_type_result
→ Shown in Analysis Report as user's session personality
→ No gameplay effect in MVP. Just informational.
```

---

## 三、User Flow

```
━━━━━━━━━━━━━━━━━━
ONBOARDING
━━━━━━━━━━━━━━━━━━

[Splash]
  ├─ logged in  ──────────────→ [Home]
  └─ not logged in
       ├─→ [Login]  ──────────→ [Home]
       └─→ [Signup]
             [Name] → [Email / Password] → [Goal Selection] → [Home]

━━━━━━━━━━━━━━━━━━
Main Flow A: Quick Start
━━━━━━━━━━━━━━━━━━

[Home]
  → pick duration chip (15 / 25 / 50 / 90 min)
  → tap "Start Focus"
  → [Timer]
       ├─ pause ⇄ resume
       ├─ early stop → confirm modal → [Reward]
       └─ time up ──────────────────→ [Reward]
                                          ↓
                                   [Analysis Report]
                                          ↓
                                       [Home]

━━━━━━━━━━━━━━━━━━
Main Flow B: Start From a Task
━━━━━━━━━━━━━━━━━━

[Home] → Nav → [Missions]
  → [+ Add Task]
       enter title + duration → save → back to [Missions]
  → tap task → [Mission Detail]
       → "Start Focus" → [Timer] (same as Flow A)

━━━━━━━━━━━━━━━━━━
Pet Interaction
━━━━━━━━━━━━━━━━━━

[Home] → tap pet → [Pet Info]
  shows: level, XP bar, current look, total focus time

━━━━━━━━━━━━━━━━━━
Stats
━━━━━━━━━━━━━━━━━━

[Home] → Nav → [Stats]
  shows: weekly focus hours, streak, session history
  → tap session → view analysis report
  → share / save image
```

---

## 四、System Flow

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
App Launch → Auth Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

App opens
  → read AsyncStorage token
       exists → Supabase verify
                  valid   → Home
                  invalid → clear token → Login
       missing → Splash → Login / Signup

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Timer — Frontend Local State
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Start
  → init local state:
       { planned_duration, started_at,
         pause_count: 0, pause_total_sec: 0,
         left_app_count: 0, left_app_total_sec: 0 }
  → begin setInterval countdown

While running:
  AppState → 'background'
    left_app_count += 1
    leave_time = Date.now()
  AppState → 'active'
    left_app_total_sec += Date.now() - leave_time

Pause:
  pause_count += 1
  pause_start = Date.now()
Resume:
  pause_total_sec += Date.now() - pause_start

Session ends (time up or early stop):
  actual_duration = elapsed - pause_total_sec - left_app_total_sec
  completed = actual_duration >= planned_duration × 0.9
  early_stop = user tapped end AND !completed
  → POST to backend

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend: Session End Processing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Receive POST session data
  → INSERT into sessions table
  → calculate focus_score → focus_type_result
  → calculate XP (base + bonus)
  → UPDATE pets SET xp = xp + xp_gained
  → check level up:
       new xp >= next level threshold?
         YES → UPDATE pets SET level = level + 1
               set level_up = true
  → return to frontend:
       { xp_gained, new_xp, new_level, level_up, focus_type }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend: Reward Screen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Receive backend response
  → show XP gained animation (+xx XP)
  → animate XP bar to new value
  → if level_up == true → play level up animation
  → show "View Report" button → Analysis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend: Analysis Report Screen
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data comes from the session POST response (no extra GET needed)
  → show: actual_duration, pause_count, left_app_count
  → show: focus_type label + description
  → show: XP earned this session

"Share"  → react-native-view-shot screenshot → expo-sharing
"Save"   → expo-media-library → camera roll
"Home"   → navigate to Home
```

---

## 五、DB Schema

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
  status       text DEFAULT 'pending',   -- 'pending' | 'done'
  created_at   timestamp DEFAULT now()
)

sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES users(id) ON DELETE CASCADE,
  task_id            uuid REFERENCES tasks(id),   -- nullable (quick start)
  planned_duration   int  NOT NULL,               -- seconds
  actual_duration    int  NOT NULL,               -- seconds
  pause_count        int  DEFAULT 0,
  pause_total_sec    int  DEFAULT 0,
  left_app_count     int  DEFAULT 0,
  left_app_total_sec int  DEFAULT 0,
  completed          boolean DEFAULT false,
  early_stop         boolean DEFAULT false,
  focus_type_result  text,                        -- 'focus' | 'flow'
  xp_earned          int  DEFAULT 0,
  started_at         timestamp,
  ended_at           timestamp DEFAULT now()
)

-- food_items table: REMOVED
-- feeding_log table: REMOVED
```

---

## 六、API Contract

---

### POST `/sessions/complete`
Called by: frontend (禹丞) when Timer ends

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
  "focus_type": "focus"
}
```

---

### GET `/pets?user_id=xxx`
Called by: Home screen, Pet Info screen on load

**Response:**
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
Called by: Stats screen on load

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "actual_duration": 1423,
      "completed": true,
      "focus_type_result": "focus",
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
  "title": "Read 30 pages",
  "duration_min": 25
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Read 30 pages",
  "duration_min": 25,
  "status": "pending"
}
```

---

### GET `/tasks?user_id=xxx`
**Response:**
```json
{
  "tasks": [
    { "id": "uuid", "title": "Read 30 pages", "duration_min": 25, "status": "pending" },
    { "id": "uuid", "title": "Homework",       "duration_min": 50, "status": "done" }
  ]
}
```

---

## 七、Mock Data (frontend use before backend is ready)

```javascript
// mockData.js

export const mockSessionResult = {
  session_id: 'mock-session-001',
  xp_gained: 30,
  new_xp: 180,
  new_level: 2,
  level_up: true,
  focus_type: 'focus',
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
      focus_type_result: 'focus', xp_earned: 30, ended_at: '2025-05-15T10:30:00Z' },
    { id: 's002', actual_duration: 890, completed: false,
      focus_type_result: 'flow', xp_earned: 5, ended_at: '2025-05-14T09:00:00Z' },
  ],
  summary: {
    total_focus_sec: 12400,
    streak_days: 3,
    total_sessions: 8,
  },
};

export const mockTasks = {
  tasks: [
    { id: 't001', title: 'Read 30 pages', duration_min: 25, status: 'pending' },
    { id: 't002', title: 'Homework',      duration_min: 50, status: 'done' },
  ],
};
```

---

## 八、Pages Removed From Scope

The following pages are **no longer needed** since the food system is removed:

| Removed Page | Reason |
|-------------|--------|
| Backpack | No food items to display |
| Farm | No plants / harvesting mechanic |

**Remaining pages:**
Splash → Login → Signup (×3) → Home → Timer → Reward → Analysis → Pet Info → Missions → Mission Detail → Stats

---

## 九、Team Assignment

| Person | Role | Owns |
|--------|------|------|
| 曉蓮 | Frontend + Design | Home, Pet Info, design system |
| 靖雯 | Frontend + Design | Onboarding, Analysis, Login, Stats |
| 禹丞 | Frontend | Navigation setup, Timer logic, Reward screen |
| 亮節 | Backend | Supabase setup, Auth, DB schema |
| 子寰 | Backend | Session end Edge Function (core XP logic) |
| 艾蓁 | Backend | Tasks/Sessions CRUD APIs, API doc maintenance |

---

## 十、Pipeline Validation Checklist (End of Week 2)

亮節 + 禹丞 verify together:

```
□ App connects to Supabase without error
□ Login with test account succeeds
□ Token saved to AsyncStorage
□ Reopen app → auto-navigates to Home (no re-login)
□ Timer completes → POST session succeeds
□ New session record visible in Supabase DB
□ Backend response matches API Contract format
□ Reward screen shows correct xp_gained and focus_type
□ level_up: true triggers level up animation
```
