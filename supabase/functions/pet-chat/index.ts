// ================================================================
// FOCO — Edge Function: pet-chat
// Calls Claude Haiku with a per-pet system prompt.
// Rate-limit: 1 request per 10 seconds per user (checked via last_chat_at in pets table).
// Runtime: Deno (Supabase Edge Functions)
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

    // Upsert rate-limit timestamp
    await supabase.from('pet_chat_rate_limit').upsert({
      user_id: user.id,
      last_at: new Date(now).toISOString(),
    })

    // ── Call Claude Haiku ──────────────────────────────────────
    const systemPrompt = PET_PROMPTS[petId] ?? PET_PROMPTS['sunion']

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!claudeRes.ok) {
      const err = await claudeRes.text()
      console.error('Claude API error:', err)
      return new Response(JSON.stringify({ error: 'ai_error' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const claudeData = await claudeRes.json()
    const reply: string = claudeData.content?.[0]?.text ?? '...'

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
