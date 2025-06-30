-- 修复分享功能的RLS策略冲突

-- 1. 删除可能有问题的公开访问策略
DROP POLICY IF EXISTS "Allow public read for sharing" ON public.pdfs;
DROP POLICY IF EXISTS "Allow service role access" ON public.pdfs;

-- 2. 确保基本的用户策略存在且正确
-- 删除现有策略，重新创建
DROP POLICY IF EXISTS "Users can view their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can insert their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON public.pdfs;

-- 重新创建用户基本策略
CREATE POLICY "Users can view their own PDFs" ON public.pdfs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDFs" ON public.pdfs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDFs" ON public.pdfs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDFs" ON public.pdfs
  FOR DELETE USING (auth.uid() = user_id);

-- 3. 为分享功能创建安全的策略
-- 这个策略只允许通过分享表访问共享的PDF
CREATE POLICY "Allow shared PDF access" ON public.pdfs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shares 
      WHERE shares.pdf_id = pdfs.id 
      AND shares.is_active = true
    )
  );

-- 4. 确保 shares 表也有正确的RLS策略
-- 先检查 shares 表是否存在
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'shares' AND schemaname = 'public') THEN
    -- 启用 RLS
    ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
    
    -- 删除现有策略
    DROP POLICY IF EXISTS "Users can view own shares" ON public.shares;
    DROP POLICY IF EXISTS "Users can create own shares" ON public.shares;
    DROP POLICY IF EXISTS "Users can update own shares" ON public.shares;
    DROP POLICY IF EXISTS "Users can delete own shares" ON public.shares;
    DROP POLICY IF EXISTS "Public can verify active shares" ON public.shares;
    
    -- 重新创建 shares 表的策略
    CREATE POLICY "Users can view own shares" ON public.shares
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create own shares" ON public.shares
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own shares" ON public.shares
      FOR UPDATE USING (auth.uid() = user_id) 
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own shares" ON public.shares
      FOR DELETE USING (auth.uid() = user_id);
      
    -- 公开访问策略（用于验证分享链接）
    CREATE POLICY "Public can verify active shares" ON public.shares
      FOR SELECT USING (
        is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
      );
      
    RAISE NOTICE 'Shares table RLS policies updated';
  ELSE
    RAISE NOTICE 'Shares table does not exist, skipping shares policies';
  END IF;
END $$;

-- 5. 修复 user_daily_quota 表的RLS策略
-- 启用 RLS
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;

-- 删除现有策略
DROP POLICY IF EXISTS "Users can view their own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert their own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update their own quota" ON public.user_daily_quota;

-- 创建新的策略
CREATE POLICY "Users can view their own quota" ON public.user_daily_quota
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own quota" ON public.user_daily_quota
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own quota" ON public.user_daily_quota
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 6. 创建索引以提升性能
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON public.pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_upload_date ON public.pdfs(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_quota_id ON public.user_daily_quota(id);
CREATE INDEX IF NOT EXISTS idx_user_daily_quota_date ON public.user_daily_quota(quota_date);

-- 如果 shares 表存在，也创建索引
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'shares' AND schemaname = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_shares_share_id ON public.shares(share_id);
    CREATE INDEX IF NOT EXISTS idx_shares_pdf_id ON public.shares(pdf_id);
    CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.shares(user_id);
    CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON public.shares(expires_at);
    CREATE INDEX IF NOT EXISTS idx_shares_is_active ON public.shares(is_active);
    RAISE NOTICE 'Shares table indexes created';
  END IF;
END $$;