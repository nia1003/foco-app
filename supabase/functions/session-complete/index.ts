// ================================================================
// FOCO — Edge Function: session-complete
// 負責：DISC 判斷 → XP 計算 → 寫入 sessions → 更新 pets → 回傳結果
// Runtime: Deno (Supabase Edge Functions)
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── DISC 判斷 ────────────────────────────────────────────────
// score 4 → conscientiousness（謹慎型）
// score 3 → dominance（主導型）
// score 2 → steadiness（穩健型）
// score ≤1 → influence（影響型）
function calcFocusType(
  completed: boolean,
  pauseCount: number,
  leftAppCount: number,
): string {
  let score = 0
  if (completed)       score += 2
  if (pauseCount === 0)    score += 1
  if (leftAppCount === 0)  score += 1

  if (score === 4) return 'conscientiousness'
  if (score === 3) return 'dominance'
  if (score === 2) return 'steadiness'
  return 'influence'
}

// ── XP 計算 ──────────────────────────────────────────────────
function calcXP(params: {
  actualDuration: number    // 秒
  completed: boolean
  earlyStop: boolean
  pauseCount: number
  leftAppCount: number
  leftAppTotalSec: number
}): number {
  const { actualDuration, completed, earlyStop,
          pauseCount, leftAppCount, leftAppTotalSec } = params

  const mins = actualDuration / 60

  // 基礎 XP（依實際專注時長）
  let base = 5
  if (mins >= 60)       base = 50
  else if (mins >= 30)  base = 30
  else if (mins >= 15)  base = 15

  // 提前放棄：只給基礎，所有加扣分取消
  if (earlyStop) return base

  let xp = base

  // 加分
  if (completed) xp += 10   // 完成目標時長

  // 折扣（有暫停 -5%、有切出 App -10%，可同時疊加）
  if (pauseCount > 0)   xp = xp * 0.95
  if (leftAppCount > 0) xp = xp * 0.90

  return Math.max(Math.round(xp), 0)  // 四捨五入，不能為負
}

// ── 升級門檻（index = level - 1）────────────────────────────
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900]

function calcLevel(totalXP: number): number {
  let level = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  return level
}

// ── 主函式 ───────────────────────────────────────────────────
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      user_id,
      task_id          = null,
      planned_duration,
      actual_duration,
      pause_count,
      pause_total_sec,
      left_app_count,
      left_app_total_sec,
      completed,
      early_stop,
      started_at,
    } = body

    // 驗證必要欄位
    if (!user_id || actual_duration == null || planned_duration == null) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, actual_duration, planned_duration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 使用 Service Role（繞過 RLS，才能寫入 sessions / 更新 pets）
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. 計算 DISC 類型 & XP ───────────────────────────────
    const focusType = calcFocusType(completed, pause_count, left_app_count)
    const xpGained  = calcXP({
      actualDuration:   actual_duration,
      completed,
      earlyStop:        early_stop,
      pauseCount:       pause_count,
      leftAppCount:     left_app_count,
      leftAppTotalSec:  left_app_total_sec,
    })

    // ── 2. 寫入 sessions ─────────────────────────────────────
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id,
        task_id,
        planned_duration,
        actual_duration,
        pause_count,
        pause_total_sec,
        left_app_count,
        left_app_total_sec,
        completed,
        early_stop,
        focus_type_result: focusType,
        xp_earned: xpGained,
        started_at,
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    // ── 3. 讀取目前 pet XP ───────────────────────────────────
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('xp, level')
      .eq('owner_id', user_id)
      .single()

    if (petError) throw petError

    const newXP    = pet.xp + xpGained
    const newLevel = Math.min(calcLevel(newXP), 5)
    const levelUp  = newLevel > pet.level

    // ── 4. 更新 pet XP & level ───────────────────────────────
    const { error: updateError } = await supabase
      .from('pets')
      .update({ xp: newXP, level: newLevel })
      .eq('owner_id', user_id)

    if (updateError) throw updateError

    // ── 5. 完成的 task 標記為 done ───────────────────────────
    if (task_id && completed) {
      await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', task_id)
    }

    // ── 6. 計算下一級 XP ─────────────────────────────────────
    // newLevel 已是 1-based；LEVEL_THRESHOLDS[newLevel] 是下一級門檻
    const xpNextLevel = newLevel < 5
      ? LEVEL_THRESHOLDS[newLevel]
      : LEVEL_THRESHOLDS[4]   // Lv.5 上限，顯示最高門檻

    // ── 7. 回傳 ──────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        session_id:    session.id,
        xp_gained:     xpGained,
        new_xp:        newXP,
        new_level:     newLevel,
        level_up:      levelUp,
        focus_type:    focusType,
        xp_next_level: xpNextLevel,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
