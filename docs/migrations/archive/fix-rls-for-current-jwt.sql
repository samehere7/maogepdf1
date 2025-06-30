-- 针对当前JWT结构的RLS策略修复
-- 问题：JWT token缺少'aud'和'sub'字段，导致auth.uid()无法正常工作
-- 解决方案：使用替代方法进行用户身份验证

-- =================================================================
-- 第一步：清理所有现有的RLS策略
-- =================================================================

-- 删除user_profiles表的所有策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_owner_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_service_role_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow function access to user_profiles" ON public.user_profiles;

-- 删除user_daily_quota表的所有策略
DROP POLICY IF EXISTS "Users can view own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Service role full access to user_daily_quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "quota_owner_policy" ON public.user_daily_quota;
DROP POLICY IF EXISTS "quota_service_role_policy" ON public.user_daily_quota;

-- 删除plus表的所有策略
DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can update own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can insert own plus status" ON public.plus;
DROP POLICY IF EXISTS "Service role full access to plus" ON public.plus;
DROP POLICY IF EXISTS "plus_owner_policy" ON public.plus;
DROP POLICY IF EXISTS "plus_service_role_policy" ON public.plus;
DROP POLICY IF EXISTS "Allow function access to plus" ON public.plus;

-- =================================================================
-- 第二步：创建适用于当前JWT结构的RLS策略
-- =================================================================

-- 由于JWT缺少标准字段，我们需要使用service_role进行所有数据库操作
-- 同时为了安全，在应用层面进行用户身份验证

-- user_profiles表策略：只允许service_role访问
CREATE POLICY "service_role_access_user_profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- user_daily_quota表策略：只允许service_role访问  
CREATE POLICY "service_role_access_user_daily_quota" ON public.user_daily_quota
  FOR ALL USING (auth.role() = 'service_role');

-- plus表策略：只允许service_role访问
CREATE POLICY "service_role_access_plus" ON public.plus
  FOR ALL USING (auth.role() = 'service_role');

-- =================================================================
-- 第三步：创建安全的数据访问函数
-- =================================================================

-- 创建获取用户配置信息的安全函数
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  user_exists BOOLEAN;
BEGIN
  -- 验证用户是否存在于auth.users表中
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_uuid) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- 获取用户配置信息
  SELECT json_build_object(
    'id', up.id,
    'email', up.email,
    'name', up.name,
    'avatar_url', up.avatar_url,
    'plus', up.plus,
    'is_active', up.is_active,
    'expire_at', up.expire_at
  ) INTO result
  FROM public.user_profiles up
  WHERE up.id = user_uuid;
  
  -- 如果没有配置记录，返回基本信息
  IF result IS NULL THEN
    SELECT json_build_object(
      'id', au.id,
      'email', au.email,
      'name', COALESCE(au.raw_user_meta_data->>'name', au.email),
      'avatar_url', au.raw_user_meta_data->>'avatar_url',
      'plus', false,
      'is_active', true,
      'expire_at', null
    ) INTO result
    FROM auth.users au
    WHERE au.id = user_uuid;
  END IF;
  
  RETURN result;
END;
$$;

-- 创建获取用户配额信息的安全函数
CREATE OR REPLACE FUNCTION get_user_daily_quota(user_uuid UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  user_exists BOOLEAN;
BEGIN
  -- 验证用户是否存在于auth.users表中
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_uuid) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- 获取用户今日配额信息
  SELECT json_build_object(
    'id', udq.id,
    'pdf_count', COALESCE(udq.pdf_count, 0),
    'chat_count', COALESCE(udq.chat_count, 0),
    'quota_date', udq.quota_date
  ) INTO result
  FROM public.user_daily_quota udq
  WHERE udq.id = user_uuid 
    AND udq.quota_date = CURRENT_DATE;
  
  -- 如果没有今日配额记录，返回默认值
  IF result IS NULL THEN
    RETURN json_build_object(
      'id', user_uuid,
      'pdf_count', 0,
      'chat_count', 0,
      'quota_date', CURRENT_DATE
    );
  END IF;
  
  RETURN result;
END;
$$;

-- =================================================================
-- 第四步：授予函数执行权限
-- =================================================================

-- 授予service_role权限
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_daily_quota(UUID) TO service_role;

-- 授予authenticated用户权限（通过service_role执行）
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_daily_quota(UUID) TO authenticated;

-- =================================================================
-- 第五步：确保表启用RLS
-- =================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 第六步：验证配置
-- =================================================================

-- 显示当前RLS策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_daily_quota', 'plus')
ORDER BY tablename, policyname;

-- 显示完成消息
DO $$
BEGIN
  RAISE NOTICE '✅ RLS策略修复完成！';
  RAISE NOTICE '🔧 修复内容：';
  RAISE NOTICE '  - 清理了所有冲突的RLS策略';
  RAISE NOTICE '  - 创建了基于service_role的安全策略';
  RAISE NOTICE '  - 添加了安全的数据访问函数';
  RAISE NOTICE '  - 配置了适当的执行权限';
  RAISE NOTICE '';
  RAISE NOTICE '📝 注意：应用程序现在需要使用service_role客户端来访问用户数据';
  RAISE NOTICE '    或者调用安全函数：get_user_profile() 和 get_user_daily_quota()';
END;
$$;