-- Task category: task | daily (simplified from legacy UI tabs)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'task';

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks
  ADD CONSTRAINT tasks_category_check CHECK (category IN ('task', 'daily'));
