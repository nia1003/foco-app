-- ================================================================
-- FOCO — Migration 004: 每個 user 建立 3 隻寵物
-- ================================================================

-- ── 1. 修正 trigger：新用戶一次建立全部 3 隻寵物 ────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 建立 public.users profile
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- 建立 3 隻初始寵物（level 1, xp 0）
  INSERT INTO public.pets (owner_id, name)
  VALUES
    (NEW.id, 'Xingwang'),
    (NEW.id, 'Lily'),
    (NEW.id, 'Fluff')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── 2. 修正已存在的 user：補上缺少的寵物 ───────────────────────
DO $$
DECLARE
  u record;
BEGIN
  FOR u IN SELECT DISTINCT owner_id FROM public.pets LOOP
    -- 如果有名叫 'Pet' 的（舊 trigger 建的），改名成 Xingwang
    UPDATE public.pets
    SET name = 'Xingwang'
    WHERE owner_id = u.owner_id AND name = 'Pet';

    -- 補上 Lily（如果沒有）
    INSERT INTO public.pets (owner_id, name)
    SELECT u.owner_id, 'Lily'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.pets WHERE owner_id = u.owner_id AND LOWER(name) = 'lily'
    );

    -- 補上 Fluff（如果沒有）
    INSERT INTO public.pets (owner_id, name)
    SELECT u.owner_id, 'Fluff'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.pets WHERE owner_id = u.owner_id AND LOWER(name) = 'fluff'
    );
  END LOOP;
END $$;
