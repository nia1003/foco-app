-- ================================================================
-- FOCO — Migration 002: Row Level Security
-- ================================================================

-- ── 開啟 RLS ──────────────────────────────────────────────────
ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- ── users：只能讀寫自己 ────────────────────────────────────────
CREATE POLICY "users: own row"
  ON public.users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── pets：只能讀寫自己的寵物 ───────────────────────────────────
CREATE POLICY "pets: own"
  ON public.pets
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── tasks：只能讀寫自己的任務 ──────────────────────────────────
CREATE POLICY "tasks: own"
  ON public.tasks
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── sessions：只能 SELECT 自己的
-- INSERT/UPDATE 由 Edge Function 用 service_role 執行（繞過 RLS）
CREATE POLICY "sessions: own read"
  ON public.sessions
  FOR SELECT
  USING (user_id = auth.uid());
