-- Add deadline_at column to tasks table
-- Stores an optional due date/time for deadline-type tasks

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz;
