#!/bin/bash
set -e
cd "$(dirname "$0")"
rm -f .git/index.lock
git add -A
git commit -m "feat: 後端 SQL migrations + session-complete Edge Function

supabase/migrations/
  001_schema.sql  - users / pets / tasks / sessions 四張 table
  002_rls.sql     - Row Level Security（users/pets/tasks 全保護，sessions 只讀）
  003_trigger.sql - 新用戶自動建 public.users + pets（level=1, xp=0）

supabase/functions/session-complete/index.ts
  - DISC 判斷（score 4/3/2/≤1 → conscientiousness/dominance/steadiness/influence）
  - XP 計算（基礎 + 加分 - 扣分，early_stop 只給基礎）
  - INSERT sessions（service_role 繞過 RLS）
  - UPDATE pets.xp + level（自動升級判斷）
  - UPDATE tasks.status = 'done'（completed session）
  - 回傳 session_id / xp_gained / new_xp / new_level / level_up / focus_type / xp_next_level

supabase/config.toml  - Supabase CLI 設定
supabase/deploy.sh    - 一鍵部署腳本"
git pull --rebase origin main
git push origin main
echo ""
echo "✅ 推送成功！"
