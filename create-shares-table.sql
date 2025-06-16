-- 创建分享表
CREATE TABLE IF NOT EXISTS shares (
  id SERIAL PRIMARY KEY,
  share_id VARCHAR(255) NOT NULL UNIQUE,
  pdf_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_shares_share_id ON shares(share_id);
CREATE INDEX IF NOT EXISTS idx_shares_pdf_id ON shares(pdf_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);

-- 启用行级安全策略
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- 创建安全策略：用户只能查看和管理自己的分享
CREATE POLICY "Users can view own shares" ON shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shares" ON shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shares" ON shares
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shares" ON shares
  FOR DELETE USING (auth.uid() = user_id);

-- 创建公开访问策略（用于验证分享链接）
CREATE POLICY "Public can verify active shares" ON shares
  FOR SELECT USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );