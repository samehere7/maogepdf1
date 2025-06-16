-- 修复 PDFs 表的 RLS 策略

-- 启用 RLS
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "Users can view their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can insert their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Allow public read for sharing" ON public.pdfs;

-- 创建新的 RLS 策略
-- 用户只能查看自己的PDF
CREATE POLICY "Users can view their own PDFs" ON public.pdfs
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的PDF记录
CREATE POLICY "Users can insert their own PDFs" ON public.pdfs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的PDF记录
CREATE POLICY "Users can update their own PDFs" ON public.pdfs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的PDF记录
CREATE POLICY "Users can delete their own PDFs" ON public.pdfs
  FOR DELETE USING (auth.uid() = user_id);

-- 创建索引以提升性能
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON public.pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_upload_date ON public.pdfs(upload_date DESC);