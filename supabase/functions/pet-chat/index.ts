// ================================================================
// FOCO — Edge Function: pet-chat  [v4]
// Calls Together AI with a per-pet system prompt.
// Rate-limit: 1 request per 10 seconds per user (pet_chat_rate_limit table).
// Runtime: Deno (Supabase Edge Functions)
//
// Setup: TOGETHER_API_KEY secret in Supabase Dashboard → Settings → Secrets
// ================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PET_PROMPTS: Record<string, string> = {
  sunion: `You are Sunion, a chubby, cheerful pet companion. Reply in English only, under 30 words. Be enthusiastic, encouraging, and a little goofy. No lecturing.`,

  lily: `You are Lily, an energetic, blunt, and playful pet companion. Reply in English only, under 30 words. Be direct and a little cheeky but warm. No rambling or lecturing.`,

  fluff: `You are Fluff, a dreamy, gentle pet companion who speaks like poetry. Reply in English only, under 30 words. Be lyrical and wistful. No blunt or practical talk.`,

  stay: `You are Stay, a calm, deep, quietly powerful pet companion. Reply in English only, under 30 words. Be minimal and impactful. No filler words or exclamation marks.`,
}

const TOGETHER_API_URL = 'https://api.together.ai/v1/chat/completions'
const TOGETHER_MODEL   = 'meta-llama/Meta-Llama-3-8B-Instruct-Lite'

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

    // ── Backend rate limit: 3 req / 10s per user (graceful — skipped if table missing) ──
    const RATE_WINDOW_MS = 10_000
    const RATE_MAX       = 3
    const now = Date.now()
    try {
      const { data: rateRow } = await supabase
        .from('pet_chat_rate_limit')
        .select('last_at, count')
        .eq('user_id', user.id)
        .maybeSingle()

      const withinWindow = rateRow?.last_at &&
        now - new Date(rateRow.last_at).getTime() < RATE_WINDOW_MS

      if (withinWindow && (rateRow.count ?? 0) >= RATE_MAX) {
        return new Response(JSON.stringify({ error: 'rate_limited' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await supabase.from('pet_chat_rate_limit').upsert({
        user_id: user.id,
        last_at: withinWindow ? rateRow!.last_at : new Date(now).toISOString(),
        count:   withinWindow ? (rateRow!.count ?? 0) + 1 : 1,
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

    const systemPrompt = PET_PROMPTS[petId] ?? PET_PROMPTS['sunion']
    console.log('[pet-chat] calling Together AI, petId:', petId)

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
      return new Response(JSON.stringify({ error: 'ai_error', detail: `${togetherRes.status}: ${err}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const togetherData = await togetherRes.json()
    const reply: string = togetherData.choices?.[0]?.message?.content?.trim() ?? '...'

    console.log('[pet-chat] Together AI success')
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
