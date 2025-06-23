-- 创建一个数据库函数来处理Plus状态更新
-- 这个函数以SECURITY DEFINER运行，可以绕过RLS限制
-- 在Supabase SQL编辑器中运行此脚本

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

-- 授予服务角色执行权限
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;

-- 测试函数
SELECT update_user_plus_status(
  'test-user-id'::UUID,
  true,
  true,
  (NOW() + INTERVAL '1 month')::TIMESTAMPTZ,
  'monthly'
);