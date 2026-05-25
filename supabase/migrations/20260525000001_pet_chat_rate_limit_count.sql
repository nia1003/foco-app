-- Add count column to support 3-per-10s rate limit window
ALTER TABLE pet_chat_rate_limit
  ADD COLUMN IF NOT EXISTS count INTEGER NOT NULL DEFAULT 1;
