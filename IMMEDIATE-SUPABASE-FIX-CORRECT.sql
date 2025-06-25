-- 立即修复 Service Role 权限问题
-- 在 Supabase SQL 编辑器中运行此脚本

-- 1. 删除错误的 service role 策略
DROP POLICY IF EXISTS "user_profiles_service_role_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "plus_service_role_policy" ON public.plus;
DROP POLICY IF EXISTS "quota_service_role_policy" ON public.user_daily_quota;

-- 2. 创建正确的 service role 策略
-- 使用 current_setting 检查 JWT role 声明
CREATE POLICY "user_profiles_service_role_policy" ON public.user_profiles
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

CREATE POLICY "plus_service_role_policy" ON public.plus
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

CREATE POLICY "quota_service_role_policy" ON public.user_daily_quota
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- 3. 为其他关键表添加 service role 策略
CREATE POLICY "pdfs_service_role_policy" ON public.pdfs
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

CREATE POLICY "flashcards_service_role_policy" ON public.flashcards
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

CREATE POLICY "flashcard_sessions_service_role_policy" ON public.flashcard_sessions
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

CREATE POLICY "shares_service_role_policy" ON public.shares
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

CREATE POLICY "share_messages_service_role_policy" ON public.share_messages
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- 4. 验证设置
SELECT 
  'Service Role policies fixed successfully' as status,
  'Please test the Service Role Key now' as next_step;