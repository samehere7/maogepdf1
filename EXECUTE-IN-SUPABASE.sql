-- =================================================
-- 立即执行：复制此内容到Supabase Dashboard SQL编辑器
-- =================================================

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
  -- 检查用户是否存在于auth.users表
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    result := json_build_object(
      'success', false,
      'error', 'User not found in auth.users',
      'user_id', user_id
    );
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
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', user_id
    );
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

-- 3. 删除现有视图（如果存在）
DROP VIEW IF EXISTS public.user_with_plus;

-- 4. 创建user_with_plus视图
CREATE VIEW public.user_with_plus AS
SELECT 
  up.id,
  up.email,
  up.name,
  up.avatar_url,
  up.created_at,
  up.updated_at,
  -- Plus状态逻辑：检查是否为Plus用户且未过期
  CASE 
    WHEN up.plus = true AND (up.expire_at IS NULL OR up.expire_at > NOW())
    THEN true 
    ELSE false 
  END as plus,
  -- 活跃状态：Plus用户且未过期且is_active为true
  CASE 
    WHEN up.plus = true 
         AND up.is_active = true 
         AND (up.expire_at IS NULL OR up.expire_at > NOW())
    THEN true 
    ELSE false 
  END as is_active,
  up.expire_at,
  -- 从plus表获取额外信息
  p.plan,
  p.paid_at,
  p.pdf_count,
  p.chat_count,
  -- 添加过期检查字段
  CASE 
    WHEN up.expire_at IS NOT NULL AND up.expire_at <= NOW()
    THEN true 
    ELSE false 
  END as is_expired,
  -- 添加剩余天数计算
  CASE 
    WHEN up.expire_at IS NOT NULL AND up.expire_at > NOW()
    THEN EXTRACT(DAYS FROM (up.expire_at - NOW()))::INTEGER
    ELSE NULL
  END as days_remaining
FROM public.user_profiles up
LEFT JOIN public.plus p ON up.id = p.id;

-- 5. 授予权限
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_plus_status(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_plus_status(UUID) TO authenticated;
GRANT SELECT ON public.user_with_plus TO authenticated;
GRANT SELECT ON public.user_with_plus TO anon;
GRANT ALL ON public.user_with_plus TO service_role;

-- 6. 验证安装
DO $$
DECLARE
  function_count INTEGER;
  view_exists BOOLEAN;
BEGIN
  -- 检查函数是否创建成功
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN ('update_user_plus_status', 'get_user_plus_status');
  
  -- 检查视图是否创建成功
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'user_with_plus'
  ) INTO view_exists;
  
  -- 输出结果
  RAISE NOTICE '=== 安装验证结果 ===';
  RAISE NOTICE '函数创建数量: %/2', function_count;
  RAISE NOTICE '视图创建状态: %', CASE WHEN view_exists THEN '成功' ELSE '失败' END;
  
  IF function_count = 2 AND view_exists THEN
    RAISE NOTICE '✅ 所有组件安装成功！';
    RAISE NOTICE '📋 已创建:';
    RAISE NOTICE '  • update_user_plus_status() 函数';
    RAISE NOTICE '  • get_user_plus_status() 函数';
    RAISE NOTICE '  • user_with_plus 视图';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 支付系统数据库配置完成！';
  ELSE
    RAISE NOTICE '❌ 部分组件安装失败，请检查错误信息';
  END IF;
END;
$$;