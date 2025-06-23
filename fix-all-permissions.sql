-- 统一的RLS策略修复脚本 - 一次性解决所有权限问题
-- 在Supabase SQL编辑器中运行

-- 1. 启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有旧策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can update own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can insert own plus status" ON public.plus;
DROP POLICY IF EXISTS "Service role full access to plus" ON public.plus;

DROP POLICY IF EXISTS "Users can view own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Service role full access to user_daily_quota" ON public.user_daily_quota;

-- 3. 创建新的统一策略
-- user_profiles 表
CREATE POLICY "user_profiles_owner_policy" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "user_profiles_service_role_policy" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- plus 表
CREATE POLICY "plus_owner_policy" ON public.plus
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "plus_service_role_policy" ON public.plus
  FOR ALL USING (auth.role() = 'service_role');

-- user_daily_quota 表
CREATE POLICY "quota_owner_policy" ON public.user_daily_quota
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "quota_service_role_policy" ON public.user_daily_quota
  FOR ALL USING (auth.role() = 'service_role');

-- 4. 创建Plus状态更新函数
CREATE OR REPLACE FUNCTION update_user_plus_status(
  user_id UUID,
  is_plus BOOLEAN,
  is_active_param BOOLEAN,
  expire_at_param TIMESTAMPTZ,
  plan_param TEXT
) RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- 更新或插入user_profiles记录
  INSERT INTO public.user_profiles (id, plus, is_active, expire_at, updated_at)
  VALUES (user_id, is_plus, is_active_param, expire_at_param, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    plus = EXCLUDED.plus,
    is_active = EXCLUDED.is_active,
    expire_at = EXCLUDED.expire_at,
    updated_at = EXCLUDED.updated_at;

  -- 更新或插入plus记录
  INSERT INTO public.plus (id, is_paid, paid_at, plan, expire_at, pdf_count, chat_count)
  VALUES (user_id, TRUE, NOW(), plan_param, expire_at_param, 0, 0)
  ON CONFLICT (id)
  DO UPDATE SET
    is_paid = EXCLUDED.is_paid,
    paid_at = EXCLUDED.paid_at,
    plan = EXCLUDED.plan,
    expire_at = EXCLUDED.expire_at;

  -- 返回成功结果
  result := json_build_object(
    'success', true,
    'user_id', user_id,
    'plan', plan_param,
    'expire_at', expire_at_param
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- 返回错误信息
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', user_id
    );
    RETURN result;
END;
$$;

-- 5. 授予函数执行权限
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO authenticated;

-- 6. 验证设置
SELECT 'RLS policies and functions created successfully' as status;