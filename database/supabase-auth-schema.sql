-- SQL Migration: Setup Profiles & Auth Sync
-- Chạy đoạn này trong SQL Editor của Supabase

-- 1. Tạo bảng Profiles (Lưu thông tin công khai)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  points INTEGER NOT NULL DEFAULT 0,
  phone TEXT,
  address TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Kích hoạt RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper functions: chạy với quyền owner để tránh đệ quy policy trên chính bảng profiles
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = check_user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_profile_role(check_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = check_user_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_profile_role(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role(UUID) TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (
    (select auth.uid()) = id
    OR public.is_admin_user((select auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin_all ON public.profiles;

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (
    (select auth.uid()) = id
    OR public.is_admin_user((select auth.uid()))
  )
  WITH CHECK (
    (
      (select auth.uid()) = id
      AND role = public.current_profile_role((select auth.uid()))
    )
    OR (
      public.is_admin_user((select auth.uid()))
      AND role IN ('admin', 'customer')
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles." ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin_all ON public.profiles;

-- 3. Trigger tự động tạo Profile khi có User mới đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure SECURITY DEFINER functions use fixed search_path to prevent role-based path hijacking.
DO $$
DECLARE
  fn_signature text;
BEGIN
  FOR fn_signature IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('handle_new_user', 'create_momo_payment')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn_signature);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =======================================================
-- Admin Bootstrap Utilities (Run manually in SQL Editor)
-- =======================================================

-- 1) Promote a user to admin by email
-- Replace the email value before running.
WITH target_user AS (
  SELECT id, email
  FROM auth.users
  WHERE lower(email) = lower('admin@example.com')
  LIMIT 1
)
UPDATE public.profiles p
SET role = 'admin',
    updated_at = timezone('utc'::text, now())
FROM target_user u
WHERE p.id = u.id;

-- 2) Verify role after promote
SELECT u.email, p.role, p.updated_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE lower(u.email) = lower('admin@example.com');

-- 3) Rollback (demote admin to customer)
WITH target_user AS (
  SELECT id, email
  FROM auth.users
  WHERE lower(email) = lower('admin@example.com')
  LIMIT 1
)
UPDATE public.profiles p
SET role = 'customer',
    updated_at = timezone('utc'::text, now())
FROM target_user u
WHERE p.id = u.id;
