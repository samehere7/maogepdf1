-- 临时修复：允许匿名用户创建和访问临时PDF记录
-- 这将解决PDF QA API中的"Invalid API key"问题

-- 1. 检查pdfs表当前的RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pdfs' AND schemaname = 'public';

-- 2. 检查pdfs表现有的RLS策略
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pdfs' AND schemaname = 'public'
ORDER BY policyname;

-- 3. 为匿名用户创建临时PDF访问策略
-- 允许匿名用户创建临时PDF记录（URL以temp://开头）
CREATE POLICY "anon_can_create_temp_pdfs" ON public.pdfs
    FOR INSERT 
    TO anon
    WITH CHECK (
        url LIKE 'temp://%' 
        AND (user_id IS NULL OR user_id = auth.uid())
    );

-- 允许匿名用户读取临时PDF记录
CREATE POLICY "anon_can_read_temp_pdfs" ON public.pdfs
    FOR SELECT 
    TO anon
    USING (
        url LIKE 'temp://%' 
        AND (user_id IS NULL OR user_id = auth.uid())
    );

-- 允许匿名用户更新自己的临时PDF记录
CREATE POLICY "anon_can_update_temp_pdfs" ON public.pdfs
    FOR UPDATE 
    TO anon
    USING (
        url LIKE 'temp://%' 
        AND (user_id IS NULL OR user_id = auth.uid())
    )
    WITH CHECK (
        url LIKE 'temp://%' 
        AND (user_id IS NULL OR user_id = auth.uid())
    );

-- 4. 确保服务角色有完全访问权限（如果密钥修复后需要）
CREATE POLICY "service_role_full_access_pdfs" ON public.pdfs
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. 确保已登录用户可以访问自己的PDF
CREATE POLICY "authenticated_users_own_pdfs" ON public.pdfs
    FOR ALL 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. 验证策略创建结果
SELECT 
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'pdfs' AND schemaname = 'public'
ORDER BY policyname;

-- 7. 测试创建临时PDF记录（可选）
-- INSERT INTO public.pdfs (id, name, url, size, user_id) 
-- VALUES ('test-temp-pdf', 'Test Temp PDF', 'temp://test-document', 0, null);

-- 返回成功消息
SELECT 'PDF临时访问策略已创建 - 匿名用户现在可以创建和访问临时PDF记录' AS result;