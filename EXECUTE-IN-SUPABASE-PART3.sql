-- =================================================
-- 第三部分：创建视图和权限设置
-- =================================================

-- 删除现有视图（如果存在）
DROP VIEW IF EXISTS public.user_with_plus;

-- 创建user_with_plus视图
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

-- 授予权限
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_plus_status(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_plus_status(UUID) TO authenticated;
GRANT SELECT ON public.user_with_plus TO authenticated;
GRANT SELECT ON public.user_with_plus TO anon;
GRANT ALL ON public.user_with_plus TO service_role;