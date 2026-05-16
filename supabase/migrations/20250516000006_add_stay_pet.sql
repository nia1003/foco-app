-- ================================================================
-- FOCO — Migration 006: 新增 Stay 寵物
-- ================================================================

-- ── 1. 更新 trigger：新用戶一次建立全部 4 隻寵物 ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.pets (owner_id, name)
  VALUES
    (NEW.id, 'Xingwang'),
    (NEW.id, 'Lily'),
    (NEW.id, 'Fluff'),
    (NEW.id, 'Stay')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── 2. 補上現有用戶缺少的 Stay ───────────────────────────────────
INSERT INTO public.pets (owner_id, name)
SELECT DISTINCT owner_id, 'Stay'
FROM public.pets
WHERE NOT EXISTS (
  SELECT 1 FROM public.pets p2
  WHERE p2.owner_id = pets.owner_id
    AND LOWER(p2.name) = 'stay'
);
