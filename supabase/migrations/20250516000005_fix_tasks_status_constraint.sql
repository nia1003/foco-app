-- Fix: allow 'deleted' as a valid status so soft-delete works.
-- The original CHECK constraint only listed ('pending', 'done'), so
-- UPDATE tasks SET status='deleted' was rejected by Postgres, causing
-- the optimistic UI delete to be silently reverted.

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('pending', 'done', 'deleted'));
