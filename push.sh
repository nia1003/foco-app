#!/bin/bash
# FOCO — push all changes to GitHub
# Run: bash push.sh

set -e
cd "$(dirname "$0")"

# Remove stale git lock if exists
rm -f .git/index.lock

git add -A

git commit -m "feat: implement FOCO spec — timer tracking, XP/DISC system, pet store, auth

New files:
- lib/supabase.ts: Supabase client with AsyncStorage session persistence
- data/mockData.ts: mock session/pet/task data for pre-backend dev
- services/focoService.ts: completeSession, getPet, getSessions, getTasks, createTask
- stores/petStore.ts: pet XP/level state with applySessionResult
- app/(app)/reward.tsx: animated XP gain + level-up screen
- app/(app)/analysis.tsx: DISC focus type report + XP breakdown
- app/(app)/pet-info.tsx: pet level, XP bar, roadmap display
- FRONTEND_GUIDELINE.md: per-person task breakdown and architecture notes

Modified files:
- types/index.ts: add FOCO types (FocoPet, Task, SessionPayload, SessionResult, TimerSnapshot)
- hooks/useTimer.ts: track pause/left_app stats via AppState; expose getSnapshot() setTaskId()
- stores/authStore.ts: migrate from SecureStore JWT to Supabase Auth session
- services/authService.ts: wrap Supabase Auth signup/login/logout
- app/(auth)/login.tsx: full email/password login UI
- app/(app)/focus.tsx: accept durationMin+taskId params, POST session-complete, mock fallback
- app/(app)/home.tsx: real pet data from petStore, duration chip selector (15/25/50/90m)
- app/(app)/missions/index.tsx: My Tasks section, create task modal, link to focus screen
- app/(app)/stats.tsx: real session data, last-7-days bar chart, DISC breakdown, recent sessions"

git push origin main

echo ""
echo "✅ 推送成功！"
