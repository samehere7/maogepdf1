-- 紧急修复：清理所有冲突的RLS策略并创建新的安全策略
-- 这个脚本将解决当前的500错误问题

-- 第一步：清理所有现有的RLS策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_owner_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_service_role_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow function access to user_profiles" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Service role full access to user_daily_quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "quota_owner_policy" ON public.user_daily_quota;
DROP POLICY IF EXISTS "quota_service_role_policy" ON public.user_daily_quota;

DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can update own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can insert own plus status" ON public.plus;
DROP POLICY IF EXISTS "Service role full access to plus" ON public.plus;
DROP POLICY IF EXISTS "plus_owner_policy" ON public.plus;
DROP POLICY IF EXISTS "plus_service_role_policy" ON public.plus;
DROP POLICY IF EXISTS "Allow function access to plus" ON public.plus;

-- 第二步：创建简单有效的service_role策略
CREATE POLICY "service_role_access_user_profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_access_user_daily_quota" ON public.user_daily_quota
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_access_plus" ON public.plus
  FOR ALL USING (auth.role() = 'service_role');

-- 第三步：确保RLS启用
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;

-- 验证策略创建
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_daily_quota', 'plus')
ORDER BY tablename, policyname;