#!/bin/bash
# FOCO — push all changes to GitHub
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock
git add -A
git commit -m "feat: Tabs layout, TabBar auto-hide, signup/profile auth wiring

- app/(app)/_layout.tsx: Stack → Tabs with custom TabBar
- components/layout/TabBar.tsx: auto-hide on focus/reward/analysis/pet-info routes
- app/(app)/home.tsx: remove manual TabBar (now from layout)
- app/(app)/stats.tsx: remove manual TabBar
- app/(app)/missions/index.tsx: remove manual TabBar
- app/(app)/focus.tsx: remove manual TabBar
- app/(auth)/signup.tsx: pass name param to profile, disable button when empty
- app/(auth)/profile.tsx: receive name, add email+password fields, call authService.signup → pet.tsx"
git pull --rebase origin main
git push origin main
echo ""
echo "✅ 推送成功！"
