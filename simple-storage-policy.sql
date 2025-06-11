-- 简化版存储桶RLS策略，可以直接在Supabase控制台SQL编辑器中执行

-- 确保pdfs桶为公开
UPDATE storage.buckets SET public = true WHERE id = 'pdfs';

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "允许所有用户上传PDF" ON storage.objects;
DROP POLICY IF EXISTS "允许所有用户下载PDF" ON storage.objects;
DROP POLICY IF EXISTS "允许管理员完全访问" ON storage.objects;

-- 创建新的上传策略 - 不限制用户，允许任何人上传到pdfs桶
CREATE POLICY "允许所有用户上传PDF" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'pdfs');

-- 创建新的下载策略 - 允许所有人下载pdfs桶的文件
CREATE POLICY "允许所有用户下载PDF" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'pdfs');

-- 创建管理员完全访问策略
CREATE POLICY "允许管理员完全访问" ON storage.objects
  USING (auth.role() IN ('service_role', 'supabase_admin'));

-- 刷新RLS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY; 