-- 为存储桶启用RLS
BEGIN;

-- 确保启用了存储扩展
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- 确保storage.objects表存在
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  CONSTRAINT "objects_pkey" PRIMARY KEY (id)
);

-- 为pdfs桶创建访问策略
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "允许所有用户上传PDF" ON storage.objects;
DROP POLICY IF EXISTS "允许所有用户下载PDF" ON storage.objects;
DROP POLICY IF EXISTS "允许管理员完全访问" ON storage.objects;

-- 创建新的上传策略 - 允许已认证用户上传到pdfs桶
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

-- 禁用RLS并重新启用（刷新策略）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户访问public桶
ALTER TABLE storage.objects FORCE ROW LEVEL SECURITY;

COMMIT; 