-- =================================================
-- 修复前端用户查询权限问题
-- 解决 403 Forbidden 错误
-- =================================================

-- 1. 修复 user_profiles 表的 RLS 策略
-- 允许用户查看和更新自己的资料
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow function access to user_profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许函数访问（保持webhook功能）
CREATE POLICY "Allow function access to user_profiles" ON public.user_profiles
    FOR ALL USING (true) WITH CHECK (true);

-- 2. 修复 user_daily_quota 表的 RLS 策略
-- 允许用户查看和更新自己的配额
DROP POLICY IF EXISTS "Users can view own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update own quota" ON public.user_daily_quota;

CREATE POLICY "Users can view own quota" ON public.user_daily_quota
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own quota" ON public.user_daily_quota
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own quota" ON public.user_daily_quota
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. 修复 plus 表的 RLS 策略
-- 允许用户查看自己的Plus状态
DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;
DROP POLICY IF EXISTS "Allow function access to plus" ON public.plus;

CREATE POLICY "Users can view own plus status" ON public.plus
    FOR SELECT USING (auth.uid() = id);

-- 允许函数访问（保持webhook功能）
CREATE POLICY "Allow function access to plus" ON public.plus
    FOR ALL USING (true) WITH CHECK (true);

-- 4. 创建或修复 user_with_plus 视图
-- 这个视图应该组合用户信息和Plus状态
DROP VIEW IF EXISTS public.user_with_plus;

CREATE VIEW public.user_with_plus AS
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

-- 5. 为视图设置 RLS 策略
ALTER VIEW public.user_with_plus SET (security_invoker = true);

-- 6. 创建安全的查询函数（如果直接视图查询有问题）
CREATE OR REPLACE FUNCTION get_user_profile_with_plus(user_id UUID DEFAULT auth.uid())
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    -- 只允许用户查询自己的数据
    IF user_id != auth.uid() AND auth.uid() IS NOT NULL THEN
        RETURN json_build_object('error', 'Access denied');
    END IF;
    
    SELECT row_to_json(profile_data)
    INTO result
    FROM (
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
        WHERE up.id = user_id
        LIMIT 1
    ) profile_data;
    
    RETURN COALESCE(result, json_build_object('error', 'Profile not found'));
END;
$$;

-- 给予函数执行权限
GRANT EXECUTE ON FUNCTION get_user_profile_with_plus(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_profile_with_plus(UUID) TO authenticated;

-- 7. 创建配额查询函数
CREATE OR REPLACE FUNCTION get_user_daily_quota(user_id UUID DEFAULT auth.uid())
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- 只允许用户查询自己的数据
    IF user_id != auth.uid() AND auth.uid() IS NOT NULL THEN
        RETURN json_build_object('error', 'Access denied');
    END IF;
    
    -- 获取或创建今日配额记录
    INSERT INTO public.user_daily_quota (id, quota_date, pdf_count, chat_count)
    VALUES (user_id, today_date, 0, 0)
    ON CONFLICT (id, quota_date) 
    DO NOTHING;
    
    -- 查询配额信息
    SELECT row_to_json(quota_data)
    INTO result
    FROM (
        SELECT pdf_count, chat_count, quota_date
        FROM public.user_daily_quota
        WHERE id = user_id AND quota_date = today_date
        LIMIT 1
    ) quota_data;
    
    RETURN COALESCE(result, json_build_object(
        'pdf_count', 0, 
        'chat_count', 0, 
        'quota_date', today_date
    ));
END;
$$;

-- 给予函数执行权限
GRANT EXECUTE ON FUNCTION get_user_daily_quota(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_daily_quota(UUID) TO authenticated;

-- 8. 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ 前端权限修复完成！';
  RAISE NOTICE '📋 已修复的权限问题:';
  RAISE NOTICE '  - user_profiles 表 RLS 策略';
  RAISE NOTICE '  - user_daily_quota 表 RLS 策略';
  RAISE NOTICE '  - plus 表 RLS 策略';
  RAISE NOTICE '  - user_with_plus 视图';
  RAISE NOTICE '  - 创建安全查询函数';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 测试函数:';
  RAISE NOTICE '  SELECT get_user_profile_with_plus();';
  RAISE NOTICE '  SELECT get_user_daily_quota();';
END;
$$;