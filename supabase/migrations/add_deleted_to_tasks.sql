-- Migration: add deleted column to tasks
-- Run this in Supabase SQL Editor or via supabase db push
-- 讓亮節在 Supabase Dashboard > SQL Editor 執行

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- 把之前用 status='deleted' 軟刪除的紀錄也標記過去（若有的話）
UPDATE tasks SET deleted = true WHERE status = 'deleted';
