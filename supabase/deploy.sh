#!/bin/bash
# ================================================================
# FOCO 後端部署腳本
# 執行前確認：
#   1. brew install supabase/tap/supabase
#   2. supabase login
#   3. 把下方 PROJECT_REF 換成你的 Supabase project ref
# ================================================================

set -e

PROJECT_REF="your-project-ref"   # ← 改成你的 project ref（Project Settings → General）

echo "🚀 部署 FOCO 後端..."

# ── Step 1: 連接到遠端 Supabase 專案 ────────────────────────
echo ""
echo "1️⃣  連接 Supabase 專案..."
supabase link --project-ref "$PROJECT_REF"

# ── Step 2: 推送 DB migrations ──────────────────────────────
echo ""
echo "2️⃣  推送 DB Schema + RLS + Trigger..."
supabase db push

# ── Step 3: 部署 Edge Function ──────────────────────────────
echo ""
echo "3️⃣  部署 session-complete Edge Function..."
supabase functions deploy session-complete --project-ref "$PROJECT_REF"

echo ""
echo "✅ 後端部署完成！"
echo ""
echo "記得在 foco-app/.env 填入："
echo "  EXPO_PUBLIC_SUPABASE_URL=https://${PROJECT_REF}.supabase.co"
echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=（Project Settings → API → anon public）"
