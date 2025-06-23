-- =================================================
-- 第二部分：创建获取用户Plus状态的函数
-- =================================================

CREATE OR REPLACE FUNCTION get_user_plus_status(user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $function$
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
$function$;