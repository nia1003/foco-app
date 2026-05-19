-- Rate-limit table for pet-chat Edge Function
CREATE TABLE IF NOT EXISTS pet_chat_rate_limit (
  user_id  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pet_chat_rate_limit ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own row
CREATE POLICY "owner access" ON pet_chat_rate_limit
  FOR ALL USING (auth.uid() = user_id);
