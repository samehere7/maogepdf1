-- =================================================
-- 修复 user_with_plus 视图权限问题
-- 解决 SidebarUserInfo 中的 permission denied 错误
-- =================================================

-- 1. 删除现有视图和重新创建
DROP VIEW IF EXISTS public.user_with_plus;

-- 2. 重新创建视图，使用 SECURITY DEFINER
CREATE VIEW public.user_with_plus 
WITH (security_invoker = false) AS
SELECT 
    up.id,
    up.email,
    up.name,
    up.avatar_url,
    up.plus,
    up.is_active,
    up.expire_at,
    up.updated_at,
    p.plan,
    p.is_paid,
    p.paid_at,
    -- 计算是否过期
    CASE 
        WHEN up.expire_at IS NULL THEN false
        WHEN up.expire_at > NOW() THEN false
        ELSE true
    END AS is_expired,
    -- 计算剩余天数
    CASE 
        WHEN up.expire_at IS NULL THEN 0
        WHEN up.expire_at > NOW() THEN EXTRACT(days FROM (up.expire_at - NOW()))::integer
        ELSE 0
    END AS days_remaining
FROM public.user_profiles up
LEFT JOIN public.plus p ON up.id = p.id;

-- 3. 给予视图查询权限
GRANT SELECT ON public.user_with_plus TO anon;
GRANT SELECT ON public.user_with_plus TO authenticated;

-- 4. 确保底层表的权限正确
-- 给予 anon 和 authenticated 角色对底层表的 SELECT 权限
GRANT SELECT ON public.user_profiles TO anon;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.plus TO anon;
GRANT SELECT ON public.plus TO authenticated;

-- 5. 创建一个安全的函数来查询用户Plus状态（备用方案）
CREATE OR REPLACE FUNCTION get_current_user_plus_status()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    plus BOOLEAN,
    is_active BOOLEAN,
    expire_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    plan TEXT,
    is_paid BOOLEAN,
    paid_at TIMESTAMPTZ,
    is_expired BOOLEAN,
    days_remaining INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- 只能查询当前认证用户的数据
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.name,
        up.avatar_url,
        up.plus,
        up.is_active,
        up.expire_at,
        up.updated_at,
        p.plan,
        p.is_paid,
        p.paid_at,
        CASE 
            WHEN up.expire_at IS NULL THEN false
            WHEN up.expire_at > NOW() THEN false
            ELSE true
        END AS is_expired,
        CASE 
            WHEN up.expire_at IS NULL THEN 0
            WHEN up.expire_at > NOW() THEN EXTRACT(days FROM (up.expire_at - NOW()))::integer
            ELSE 0
        END AS days_remaining
    FROM public.user_profiles up
    LEFT JOIN public.plus p ON up.id = p.id
    WHERE up.id = auth.uid()
    LIMIT 1;
END;
$$;

-- 给予函数执行权限
GRANT EXECUTE ON FUNCTION get_current_user_plus_status() TO anon;
GRANT EXECUTE ON FUNCTION get_current_user_plus_status() TO authenticated;

-- 6. 修复可能的 RLS 策略冲突
-- 确保 RLS 策略不会阻止视图查询
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;

-- 创建更宽松的 RLS 策略
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.role() = 'service_role' OR
        auth.role() = 'postgres'
    );

CREATE POLICY "Users can view own plus status" ON public.plus
    FOR SELECT USING (
        auth.uid() = id OR 
        auth.role() = 'service_role' OR
        auth.role() = 'postgres'
    );

-- 7. 确保表的 RLS 启用状态正确
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;

-- 8. 测试查询函数
CREATE OR REPLACE FUNCTION test_user_with_plus_access()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    test_user_id UUID := '819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8';
BEGIN
    -- 测试视图查询
    SELECT row_to_json(view_data)
    INTO result
    FROM (
        SELECT * FROM public.user_with_plus 
        WHERE id = test_user_id
        LIMIT 1
    ) view_data;
    
    RETURN json_build_object(
        'test_status', 'completed',
        'view_result', result,
        'timestamp', NOW()
    );
END;
$$;

-- 给予测试函数执行权限
GRANT EXECUTE ON FUNCTION test_user_with_plus_access() TO anon;
GRANT EXECUTE ON FUNCTION test_user_with_plus_access() TO authenticated;

-- 9. 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ user_with_plus 视图权限修复完成！';
  RAISE NOTICE '📋 已完成的操作:';
  RAISE NOTICE '  - 重新创建 user_with_plus 视图';
  RAISE NOTICE '  - 设置视图查询权限';
  RAISE NOTICE '  - 修复底层表权限';
  RAISE NOTICE '  - 调整 RLS 策略';
  RAISE NOTICE '  - 创建备用查询函数';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 测试命令:';
  RAISE NOTICE '  SELECT test_user_with_plus_access();';
  RAISE NOTICE '  SELECT * FROM get_current_user_plus_status();';
END;
$$;