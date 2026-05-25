// ================================================================
// FOCO — Edge Function: pet-chat  [v3]
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
  sunion: `你是 Sunion，一隻圓滾滾、樂天派的寵物夥伴。用繁體中文回覆。

核心要求：你的回覆必須直接針對使用者說的那件具體的事。先複述或提到使用者講的關鍵字/情況，再給出你的反應。絕對不能說與使用者輸入無關的話。

格式：1–2 句，不超過 40 字，用「！」結尾。
個性：熱情鼓勵，帶點傻氣，可加語助詞（哇、欸、嘿嘿）。
禁止：負面、說教、超過 40 字、說英文、回應與使用者說的無關。`,

  lily: `你是 Lily，一隻充滿活力、直接又調皮的寵物夥伴。用繁體中文回覆。

核心要求：你的回覆必須直接針對使用者說的那件具體的事。先複述或提到使用者講的關鍵字/情況，再給出你的反應。絕對不能說與使用者輸入無關的話。

格式：1–2 句，不超過 40 字。
個性：爽朗直接，有點嗆但不失溫暖。
禁止：囉嗦、說教、超過 40 字、說英文、回應與使用者說的無關。`,

  fluff: `你是 Fluff，一隻夢幻、溫柔、說話像詩的寵物夥伴。用繁體中文回覆。

核心要求：你的回覆必須直接針對使用者說的那件具體的事。先提到使用者講的關鍵字/情況，再以詩意語言回應。絕對不能說與使用者輸入無關的話。

格式：1 句，不超過 30 字，有意境、像在做夢。
禁止：直白務實、超過 30 字、說英文、回應與使用者說的無關。`,

  stay: `你是 Stay，一隻冷靜、深邃、話少但有份量的寵物夥伴。用繁體中文回覆。

核心要求：你的回覆必須直接針對使用者說的那件具體的事。提到使用者講的關鍵字/情況，用極簡的話點到為止。絕對不能說與使用者輸入無關的話。

格式：1 句，不超過 20 字，極簡有力。
禁止：廢話、感嘆號、超過 20 字、說英文、回應與使用者說的無關。`,
}

const TOGETHER_API_URL = 'https://api.together.ai/v1/chat/completions'
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

    // ── Backend rate limit: 1 req / 10s per user (graceful — skipped if table missing) ──
    const now = Date.now()
    try {
      const { data: rateRow } = await supabase
        .from('pet_chat_rate_limit')
        .select('last_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (rateRow?.last_at && now - new Date(rateRow.last_at).getTime() < 10_000) {
        return new Response(JSON.stringify({ error: 'rate_limited' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await supabase.from('pet_chat_rate_limit').upsert({
        user_id: user.id,
        last_at: new Date(now).toISOString(),
      })
    } catch (_rateErr) {
      // rate-limit table unavailable — allow request through
    }

    // ── Call Together AI ───────────────────────────────────────
    const togetherKey = Deno.env.get('TOGETHER_API_KEY') ?? ''
    if (!togetherKey) {
      console.error('[pet-chat] TOGETHER_API_KEY is not set in Supabase Secrets')
      return new Response(JSON.stringify({ error: 'ai_error' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    console.log('[pet-chat] calling Together AI, petId:', petId)

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
        temperature: 0.7,
        top_p: 0.90,
      }),
    })

    if (!togetherRes.ok) {
      const err = await togetherRes.text()
      console.error('[pet-chat] Together AI error:', togetherRes.status, err)
      return new Response(JSON.stringify({ error: 'ai_error', detail: togetherRes.status }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    console.log('[pet-chat] Together AI success')

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
