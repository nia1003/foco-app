-- ================================================================
-- FOCO — Migration 003: Auto-create user profile + pet on signup
-- ================================================================

-- 新用戶註冊後，自動建立 public.users profile 和初始寵物
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER                 -- 用 superuser 權限執行，能寫入 public.users
SET search_path = public
AS $$
BEGIN
  -- 1. 建立 public.users profile
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;   -- 防止重複觸發

  -- 2. 建立初始寵物（level 1, xp 0）
  INSERT INTO public.pets (owner_id, name)
  VALUES (NEW.id, 'Pet')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- 綁定 Trigger：auth.users 新增後觸發
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
