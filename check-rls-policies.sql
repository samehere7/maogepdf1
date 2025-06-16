-- 检查当前pdfs表的RLS策略
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'pdfs';

-- 检查pdfs表是否启用了RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'pdfs';

-- 查看pdfs表的结构
\d pdfs;

-- 创建或更新策略以支持分享访问
-- 注意：这些策略应该根据实际需求调整

-- 为分享功能添加公开读取策略（仅用于分享）
CREATE POLICY IF NOT EXISTS "Allow public read for sharing" ON pdfs
  FOR SELECT USING (true);

-- 或者更安全的方式：只允许通过API访问
-- CREATE POLICY IF NOT EXISTS "Allow service role access" ON pdfs
--   FOR SELECT USING (auth.role() = 'service_role');