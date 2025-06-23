-- =================================================
-- 修复Paddle支付系统数据库权限问题
-- 执行此脚本解决 "permission denied for schema public" 错误
-- =================================================

-- 1. 确保必要的权限设置
-- 给予服务角色对public schema的使用权限
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 给予匿名用户对特定函数的执行权限
GRANT USAGE ON SCHEMA public TO anon;

-- 2. 重新创建Plus状态更新函数（带完整权限）
CREATE OR REPLACE FUNCTION update_user_plus_status(
  user_id UUID,
  is_plus BOOLEAN,
  is_active_param BOOLEAN,
  expire_at_param TIMESTAMPTZ,
  plan_param TEXT
) RETURNS JSON
SECURITY DEFINER -- 使用定义者权限（postgres用户权限）
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  user_exists BOOLEAN;
BEGIN
  -- 记录函数调用（用于调试）
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

  -- 确保user_profiles记录存在
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

-- 3. 给予必要的执行权限
-- 允许服务角色执行这个函数
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;

-- 允许匿名用户执行这个函数（用于webhook调用）
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO anon;

-- 4. 确保RLS策略允许函数操作
-- 临时禁用user_profiles表的RLS（函数内部操作）
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus DISABLE ROW LEVEL SECURITY;

-- 重新启用RLS并创建允许函数操作的策略
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;

-- 为函数创建绕过RLS的策略
CREATE POLICY "Allow function access to user_profiles" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow function access to plus" ON public.plus
  FOR ALL USING (true) WITH CHECK (true);

-- 5. 创建测试函数验证权限
CREATE OR REPLACE FUNCTION test_plus_update()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  test_user_id UUID := '819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8';
  result JSON;
BEGIN
  -- 测试更新函数
  SELECT update_user_plus_status(
    test_user_id,
    true,
    true,
    NOW() + INTERVAL '1 year',
    'test'
  ) INTO result;
  
  RETURN json_build_object(
    'test_status', 'completed',
    'function_result', result,
    'timestamp', NOW()
  );
END;
$$;

-- 给予测试函数执行权限
GRANT EXECUTE ON FUNCTION test_plus_update() TO service_role;
GRANT EXECUTE ON FUNCTION test_plus_update() TO anon;

-- 6. 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ 数据库权限修复完成！';
  RAISE NOTICE '📋 已完成的操作:';
  RAISE NOTICE '  - 设置schema权限';
  RAISE NOTICE '  - 重新创建update_user_plus_status函数';
  RAISE NOTICE '  - 配置函数执行权限';
  RAISE NOTICE '  - 调整RLS策略';
  RAISE NOTICE '  - 创建测试函数';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 请运行以下命令测试:';
  RAISE NOTICE '  SELECT test_plus_update();';
END;
$$;