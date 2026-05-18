-- ─────────────────────────────────────────────
-- Migration: 微反思結算欄位
-- Adds reflection data columns to sessions + task progress to tasks
-- ─────────────────────────────────────────────

-- sessions: 三個反思欄位
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS distraction_reasons text[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completion_percent   integer,
  ADD COLUMN IF NOT EXISTS mood_score           integer
    CHECK (mood_score IS NULL OR mood_score BETWEEN 1 AND 5);

-- tasks: 跨 session 的完成度持久化
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completion_percent integer DEFAULT 0
    CHECK (completion_percent BETWEEN 0 AND 100);

COMMENT ON COLUMN sessions.distraction_reasons IS '分心原因標籤陣列，使用者在微反思表單選擇';
COMMENT ON COLUMN sessions.completion_percent  IS '使用者自評本次完成度 0–100';
COMMENT ON COLUMN sessions.mood_score          IS '心情評分 1（很糟）–5（很棒）';
COMMENT ON COLUMN tasks.completion_percent     IS '累計完成度，跨 session 持久化，100 時 status 設為 done';
