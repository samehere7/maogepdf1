-- 修复用户配置表和配额表的RLS策略
-- 这个脚本需要在Supabase SQL编辑器中运行

-- 1. 检查当前用户相关表的RLS状态
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'user_daily_quota', 'plus');

-- 2. 检查现有策略
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_daily_quota', 'plus');

-- 3. 为user_profiles表创建RLS策略
-- 允许用户读取和更新自己的配置文件
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. 为user_daily_quota表创建RLS策略
DROP POLICY IF EXISTS "Users can view own quota" ON public.user_daily_quota;
CREATE POLICY "Users can view own quota" ON public.user_daily_quota
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own quota" ON public.user_daily_quota;
CREATE POLICY "Users can update own quota" ON public.user_daily_quota
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own quota" ON public.user_daily_quota;
CREATE POLICY "Users can insert own quota" ON public.user_daily_quota
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. 为plus表创建RLS策略
DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;
CREATE POLICY "Users can view own plus status" ON public.plus
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own plus status" ON public.plus;
CREATE POLICY "Users can update own plus status" ON public.plus
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own plus status" ON public.plus;
CREATE POLICY "Users can insert own plus status" ON public.plus
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. 确保表启用了RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;

-- 7. 允许服务角色完全访问（用于webhook和后台操作）
DROP POLICY IF EXISTS "Service role full access to user_profiles" ON public.user_profiles;
CREATE POLICY "Service role full access to user_profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to user_daily_quota" ON public.user_daily_quota;
CREATE POLICY "Service role full access to user_daily_quota" ON public.user_daily_quota
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access to plus" ON public.plus;
CREATE POLICY "Service role full access to plus" ON public.plus
  FOR ALL USING (auth.role() = 'service_role');

-- 8. 验证策略是否生效
SELECT 'RLS policies created successfully' as status;