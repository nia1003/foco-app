// ================================================================
// FOCO — Edge Function: session-complete
// 負責：Quality Score → DISC 判斷 → XP 計算 → 寫入 sessions → 更新 pets → 回傳結果
// Runtime: Deno (Supabase Edge Functions)
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Quality Score (0–100) ────────────────────────────────────
function calcQualityScore(params: {
  actualDuration: number
  plannedDuration: number
  completed: boolean
  earlyStop: boolean
  pauseCount: number
  leftAppCount: number
  leftAppTotalSec: number
}): number {
  const { actualDuration, plannedDuration, completed, earlyStop,
          pauseCount, leftAppCount, leftAppTotalSec } = params

  if (earlyStop) {
    const ratio = plannedDuration > 0 ? actualDuration / plannedDuration : 0
    return Math.round(ratio * 40)
  }

  // 完成度 (0–70)
  const completionRatio = plannedDuration > 0
    ? Math.min(actualDuration / plannedDuration, 1.0)
    : 1.0
  let score = Math.round(completionRatio * 70)

  // 完成獎勵 (+15)
  if (completed) score += 15

  // 暫停扣分：每次 -5，最多扣 20
  score -= Math.min(pauseCount * 5, 20)

  // 切出 App 扣分：每次 -8，最多扣 25
  score -= Math.min(leftAppCount * 8, 25)

  // 長時間切出扣分（超過 2 分鐘算嚴重分心）
  if (leftAppTotalSec > 120) score -= 10

  return Math.max(0, Math.min(100, score))
}

// ── DISC 判斷（quality score 作為輔助維度）──────────────────
function calcFocusType(
  completed: boolean,
  pauseCount: number,
  leftAppCount: number,
  qualityScore: number,
): string {
  const interrupts = pauseCount + leftAppCount

  if (completed && qualityScore >= 75)  return 'conscientiousness'
  if (completed && interrupts <= 3)     return 'dominance'
  if (!completed && interrupts <= 2)    return 'steadiness'
  return 'influence'
}

// ── XP 計算（quality score 作為乘數 0.5x～1.5x）─────────────
function calcXP(params: {
  actualDuration: number
  earlyStop: boolean
  qualityScore: number
}): number {
  const { actualDuration, earlyStop, qualityScore } = params
  const mins = actualDuration / 60

  let base: number
  if (mins >= 60)       base = 60
  else if (mins >= 45)  base = 45
  else if (mins >= 30)  base = 30
  else if (mins >= 20)  base = 20
  else if (mins >= 10)  base = 12
  else                  base = 6

  if (earlyStop) return base

  // quality=100 → 1.5x, quality=50 → 1.0x, quality=0 → 0.5x
  const multiplier = 0.50 + (qualityScore / 100)
  return Math.max(Math.round(base * multiplier), 1)
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      user_id,
      pet_id,
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
      events           = [],
    } = body

    const ended_at = new Date().toISOString()


    if (!user_id || !pet_id || actual_duration == null || planned_duration == null) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, pet_id, actual_duration, planned_duration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. Quality Score → DISC → XP ─────────────────────────
    const qualityScore = calcQualityScore({
      actualDuration:  actual_duration,
      plannedDuration: planned_duration,
      completed,
      earlyStop:       early_stop,
      pauseCount:      pause_count,
      leftAppCount:    left_app_count,
      leftAppTotalSec: left_app_total_sec,
    })

    const focusType = calcFocusType(completed, pause_count, left_app_count, qualityScore)

    const xpGained = calcXP({
      actualDuration: actual_duration,
      earlyStop:      early_stop,
      qualityScore,
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
        xp_earned:         xpGained,
        quality_score:     qualityScore,
        started_at,
        ended_at,
        events,
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    // ── 3. 讀取目前 pet XP（找不到就跳過，不中斷 session 儲存）──
    const { data: pet } = await supabase
      .from('pets')
      .select('xp, level')
      .eq('id', pet_id)
      .maybeSingle()

    let newXP    = xpGained
    let newLevel = 1
    let levelUp  = false

    if (pet) {
      newXP    = pet.xp + xpGained
      newLevel = Math.min(calcLevel(newXP), 5)
      levelUp  = newLevel > pet.level

      // ── 4. 更新 pet ────────────────────────────────────────
      await supabase
        .from('pets')
        .update({ xp: newXP, level: newLevel })
        .eq('id', pet_id)
    }

    // ── 5. 完成任務標記 done ─────────────────────────────────
    if (task_id && completed) {
      await supabase
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', task_id)
    }

    // ── 6. 下一級 XP 門檻 ────────────────────────────────────
    const xpNextLevel = newLevel < 5
      ? LEVEL_THRESHOLDS[newLevel]
      : LEVEL_THRESHOLDS[4]

    // ── 7. 回傳（含 quality_score 供前端顯示）────────────────
    return new Response(
      JSON.stringify({
        session_id:    session.id,
        pet_id,
        xp_gained:     xpGained,
        new_xp:        newXP,
        new_level:     newLevel,
        level_up:      levelUp,
        focus_type:    focusType,
        xp_next_level: xpNextLevel,
        quality_score: qualityScore,
        ended_at,
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
