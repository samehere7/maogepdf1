-- 创建缺失的表结构

-- 创建 public.pdfs 表
CREATE TABLE IF NOT EXISTS public.pdfs (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  last_viewed TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT DEFAULT 'application/pdf',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pdfs_upload_date ON public.pdfs(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON public.pdfs(user_id);

-- 创建 public.chat_messages 表
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES public.pdfs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_document_id ON public.chat_messages(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- 创建 public.user_profiles 表
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  plus BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  expire_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 public.plus 表
CREATE TABLE IF NOT EXISTS public.plus (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_paid BOOLEAN DEFAULT TRUE,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  plan TEXT DEFAULT 'plus',
  expire_at TIMESTAMPTZ,
  pdf_count INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0
);

-- 创建 public.user_daily_quota 表
CREATE TABLE IF NOT EXISTS public.user_daily_quota (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_count INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0,
  quota_date DATE DEFAULT CURRENT_DATE
);

-- 插入测试数据（如果需要）
-- 首先检查是否有现有用户
DO $$
DECLARE
    user_count INTEGER;
    test_user_id UUID;
BEGIN
    -- 检查用户数量
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count > 0 THEN
        -- 如果有用户，为每个用户创建profile
        INSERT INTO public.user_profiles (id, email, name, plus, is_active, created_at, updated_at)
        SELECT 
            id,
            email,
            COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)) as name,
            FALSE as plus,
            TRUE as is_active,
            created_at,
            updated_at
        FROM auth.users
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_profiles WHERE user_profiles.id = users.id
        );
        
        RAISE NOTICE '已为现有用户创建profile记录';
    END IF;
END $$;