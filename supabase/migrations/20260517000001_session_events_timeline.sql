-- Add timeline tracking columns to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS quality_score  integer  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ended_at       timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS events         jsonb    DEFAULT '[]'::jsonb;
