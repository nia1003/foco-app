// ================================================================
// FOCO — Edge Function: pet-chat
// Calls Together AI (free tier) with a per-pet system prompt.
// Rate-limit: 1 request per 10 seconds per user (pet_chat_rate_limit table).
// Runtime: Deno (Supabase Edge Functions)
//
// Setup: add TOGETHER_API_KEY secret in Supabase Dashboard → Settings → Secrets
//   Get a free key at: https://api.together.ai/
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PET_PROMPTS: Record<string, string> = {
  sunion: `你是 Sunion，一隻圓滾滾、樂天派的寵物夥伴。個性熱情、鼓勵、帶點傻氣。
說話規則：只說 1–2 句，字數不超過 40 字，用「！」結尾，偶爾加可愛的語助詞。
禁止：負面評價、具體建議、問問題、超過 40 字。`,

  lily: `你是 Lily，一隻充滿活力、直接又調皮的夥伴。個性爽朗、有點嗆，說話帶勁。
說話規則：只說 1–2 句，字數不超過 40 字，語氣有點酷但不失溫暖。
禁止：囉嗦、說教、超過 40 字。`,

  fluff: `你是 Fluff，一隻夢幻、溫柔、說話像詩的夥伴。個性輕聲細語、帶點神秘。
說話規則：只說 1 句，字數不超過 30 字，語句有意境、像在做夢。
禁止：直接、務實、超過 30 字。`,

  stay: `你是 Stay，一隻冷靜、深邃、話少但有份量的夥伴。個性沉穩、偶爾帶點哲學感。
說話規則：只說 1 句，字數不超過 20 字，極簡。
禁止：廢話、感嘆號、超過 20 字。`,
}

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'
const TOGETHER_MODEL   = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { message, petId } = await req.json() as { message: string; petId: string }

    if (!message?.trim() || !petId) {
      return new Response(JSON.stringify({ error: 'Missing message or petId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Backend rate limit: 1 req / 10s per user ──────────────
    const { data: rateRow } = await supabase
      .from('pet_chat_rate_limit')
      .select('last_at')
      .eq('user_id', user.id)
      .maybeSingle()

    const now = Date.now()
    if (rateRow?.last_at && now - new Date(rateRow.last_at).getTime() < 10_000) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await supabase.from('pet_chat_rate_limit').upsert({
      user_id: user.id,
      last_at: new Date(now).toISOString(),
    })

    // ── Call Together AI ───────────────────────────────────────
    const togetherKey = Deno.env.get('TOGETHER_API_KEY') ?? ''
    if (!togetherKey) {
      console.error('TOGETHER_API_KEY not set')
      return new Response(JSON.stringify({ error: 'ai_error' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = PET_PROMPTS[petId] ?? PET_PROMPTS['sunion']

    const togetherRes = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${togetherKey}`,
      },
      body: JSON.stringify({
        model: TOGETHER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: message },
        ],
        max_tokens: 80,
        temperature: 0.9,
        top_p: 0.95,
      }),
    })

    if (!togetherRes.ok) {
      const err = await togetherRes.text()
      console.error('Together AI error:', togetherRes.status, err)
      return new Response(JSON.stringify({ error: 'ai_error' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const togetherData = await togetherRes.json()
    const reply: string = togetherData.choices?.[0]?.message?.content?.trim() ?? '...'

    return new Response(JSON.stringify({ reply }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('pet-chat error:', e)
    return new Response(JSON.stringify({ error: 'internal_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
