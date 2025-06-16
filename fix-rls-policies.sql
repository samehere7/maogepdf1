-- 检查和修复RLS策略

-- 1. 启用RLS
ALTER TABLE pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_with_plus ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own pdfs" ON pdfs;
DROP POLICY IF EXISTS "Users can insert own pdfs" ON pdfs;
DROP POLICY IF EXISTS "Users can update own pdfs" ON pdfs;
DROP POLICY IF EXISTS "Users can delete own pdfs" ON pdfs;

DROP POLICY IF EXISTS "Users can view own chats" ON pdf_chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON pdf_chats;
DROP POLICY IF EXISTS "Users can update own chats" ON pdf_chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON pdf_chats;

DROP POLICY IF EXISTS "Users can view own quota" ON user_daily_quota;
DROP POLICY IF EXISTS "Users can insert own quota" ON user_daily_quota;
DROP POLICY IF EXISTS "Users can update own quota" ON user_daily_quota;

DROP POLICY IF EXISTS "Users can view own plus status" ON user_with_plus;
DROP POLICY IF EXISTS "Users can insert own plus status" ON user_with_plus;
DROP POLICY IF EXISTS "Users can update own plus status" ON user_with_plus;

-- 3. 创建新的策略
-- PDFs表策略
CREATE POLICY "Users can view own pdfs" ON pdfs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pdfs" ON pdfs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pdfs" ON pdfs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pdfs" ON pdfs
    FOR DELETE USING (auth.uid() = user_id);

-- PDF Chats表策略
CREATE POLICY "Users can view own chats" ON pdf_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats" ON pdf_chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chats" ON pdf_chats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chats" ON pdf_chats
    FOR DELETE USING (auth.uid() = user_id);

-- User Daily Quota表策略
CREATE POLICY "Users can view own quota" ON user_daily_quota
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own quota" ON user_daily_quota
    FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own quota" ON user_daily_quota
    FOR UPDATE USING (auth.uid()::text = id);

-- User With Plus表策略
CREATE POLICY "Users can view own plus status" ON user_with_plus
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own plus status" ON user_with_plus
    FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can update own plus status" ON user_with_plus
    FOR UPDATE USING (auth.uid()::text = id);

-- 4. 检查存储桶RLS策略
-- 如果存储桶没有正确的策略，需要在Supabase控制台中手动设置
-- Storage > Policies > 添加以下策略：
-- - 允许用户上传自己的文件
-- - 允许所有人读取文件（如果需要分享功能）