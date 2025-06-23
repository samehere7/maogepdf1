-- 创建user_with_plus视图
-- 在Supabase SQL编辑器中运行此脚本

-- 删除现有视图（如果存在）
DROP VIEW IF EXISTS public.user_with_plus;

-- 创建改进的user_with_plus视图
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

-- 为视图添加注释
COMMENT ON VIEW public.user_with_plus IS 'Combined view of user profiles with Plus membership status and expiration logic';

-- 设置RLS策略
ALTER VIEW public.user_with_plus OWNER TO postgres;

-- 创建RLS策略，允许用户查看自己的记录
CREATE POLICY "Users can view own record in user_with_plus"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 授予必要权限
GRANT SELECT ON public.user_with_plus TO authenticated;
GRANT SELECT ON public.user_with_plus TO anon;
GRANT ALL ON public.user_with_plus TO service_role;

-- 验证视图创建
DO $$
DECLARE
  view_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'user_with_plus'
  ) INTO view_exists;
  
  IF view_exists THEN
    RAISE NOTICE '✅ user_with_plus view created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create user_with_plus view';
  END IF;
END;
$$;