-- ================================================================
-- FOCO — Migration 001: Tables
-- 在 Supabase SQL Editor 執行，或透過 supabase db push
-- ================================================================

-- ──────────────────────────────────────────────────────────────
-- 1. users（Supabase Auth 的 public profile）
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL DEFAULT 'User',
  email       text        UNIQUE NOT NULL,
  goals       text[]      DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 2. pets（每個 user 對應一隻寵物）
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        text        DEFAULT 'Pet',
  level       int         DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  xp          int         DEFAULT 0 CHECK (xp >= 0),
  created_at  timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 3. tasks
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  duration_min int         NOT NULL CHECK (duration_min > 0),
  status       text        DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  created_at   timestamptz DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 4. sessions（每次計時紀錄）
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id            uuid        REFERENCES public.tasks(id) ON DELETE SET NULL,
  planned_duration   int         NOT NULL,
  actual_duration    int         NOT NULL,
  pause_count        int         DEFAULT 0,
  pause_total_sec    int         DEFAULT 0,
  left_app_count     int         DEFAULT 0,
  left_app_total_sec int         DEFAULT 0,
  completed          boolean     DEFAULT false,
  early_stop         boolean     DEFAULT false,
  focus_type_result  text        CHECK (focus_type_result IN (
                                   'conscientiousness', 'dominance', 'steadiness', 'influence'
                                 )),
  xp_earned          int         DEFAULT 0,
  started_at         timestamptz,
  ended_at           timestamptz DEFAULT now()
);
