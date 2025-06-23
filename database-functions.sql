-- 支付系统数据库函数 - 改进版本
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 创建Plus状态更新函数
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
  user_exists BOOLEAN;
BEGIN
  -- 记录函数调用
  RAISE LOG 'update_user_plus_status called for user_id: %, plan: %', user_id, plan_param;
  
  -- 检查用户是否存在于auth.users表
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    result := json_build_object(
      'success', false,
      'error', 'User not found in auth.users',
      'user_id', user_id
    );
    RAISE LOG 'User not found: %', user_id;
    RETURN result;
  END IF;

  -- 确保user_profiles记录存在（先查询再插入）
  INSERT INTO public.user_profiles (id, email, plus, is_active, expire_at, updated_at)
  SELECT 
    user_id,
    COALESCE(au.email, 'unknown@example.com'),
    is_plus,
    is_active_param,
    expire_at_param,
    NOW()
  FROM auth.users au WHERE au.id = user_id
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
    is_paid = TRUE,
    paid_at = NOW(),
    plan = EXCLUDED.plan,
    expire_at = EXCLUDED.expire_at,
    pdf_count = COALESCE(public.plus.pdf_count, 0),
    chat_count = COALESCE(public.plus.chat_count, 0);

  -- 返回成功结果
  result := json_build_object(
    'success', true,
    'user_id', user_id,
    'plan', plan_param,
    'expire_at', expire_at_param,
    'updated_at', NOW()
  );
  
  RAISE LOG 'Successfully updated plus status for user: %', user_id;
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 返回详细错误信息
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE,
      'user_id', user_id,
      'timestamp', NOW()
    );
    RAISE LOG 'Error updating plus status for user %: %', user_id, SQLERRM;
    RETURN result;
END;
$$;

-- 2. 创建获取用户Plus状态的函数
CREATE OR REPLACE FUNCTION get_user_plus_status(user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  user_data RECORD;
BEGIN
  -- 查询用户的Plus状态
  SELECT 
    up.id,
    up.email,
    up.name,
    up.plus,
    up.is_active,
    up.expire_at,
    p.plan,
    p.paid_at
  INTO user_data
  FROM public.user_profiles up
  LEFT JOIN public.plus p ON up.id = p.id
  WHERE up.id = user_id;
  
  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'error', 'User profile not found',
      'user_id', user_id
    );
  ELSE
    -- 检查是否过期
    DECLARE
      is_expired BOOLEAN := user_data.expire_at IS NOT NULL AND user_data.expire_at < NOW();
    BEGIN
      result := json_build_object(
        'success', true,
        'user_id', user_data.id,
        'email', user_data.email,
        'name', user_data.name,
        'plus', user_data.plus AND NOT is_expired,
        'is_active', user_data.is_active AND NOT is_expired,
        'expire_at', user_data.expire_at,
        'plan', user_data.plan,
        'paid_at', user_data.paid_at,
        'is_expired', is_expired
      );
    END;
  END IF;
  
  RETURN result;
END;
$$;

-- 授予服务角色执行权限
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_plus_status(UUID) TO service_role;

-- 也允许认证用户调用get_user_plus_status查询自己的状态
GRANT EXECUTE ON FUNCTION get_user_plus_status(UUID) TO authenticated;

-- 添加RLS策略，确保用户只能查询自己的状态
CREATE POLICY "Users can view own plus status"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 确保plus表也有正确的RLS策略
CREATE POLICY "Users can view own plus record"
ON public.plus
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 验证函数创建成功
DO $$
BEGIN
  RAISE NOTICE 'Database functions created successfully!';
  RAISE NOTICE 'Functions available:';
  RAISE NOTICE '- update_user_plus_status(user_id, is_plus, is_active, expire_at, plan)';
  RAISE NOTICE '- get_user_plus_status(user_id)';
END;
$$;