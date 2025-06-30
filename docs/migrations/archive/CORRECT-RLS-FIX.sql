-- 正确的 RLS 策略修复 SQL
-- 先删除可能存在的策略，然后创建新的

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "service_role_access_user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "service_role_access_user_daily_quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "service_role_access_pdfs" ON public.pdfs;
DROP POLICY IF EXISTS "service_role_access_plus" ON public.plus;

-- 创建新的策略
CREATE POLICY "service_role_access_user_profiles" 
ON public.user_profiles FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_access_user_daily_quota" 
ON public.user_daily_quota FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_access_pdfs" 
ON public.pdfs FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_access_plus" 
ON public.plus FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 验证策略是否创建成功
SELECT schemaname, tablename, policyname, roles 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_daily_quota', 'pdfs', 'plus')
AND policyname LIKE '%service_role%';