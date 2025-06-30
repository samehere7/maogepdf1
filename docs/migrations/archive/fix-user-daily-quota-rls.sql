-- 修复 user_daily_quota 表的 RLS 策略

-- 首先启用 RLS
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert their own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update their own quota" ON public.user_daily_quota;

-- 创建新的 RLS 策略
-- 用户只能查看自己的配额
CREATE POLICY "Users can view their own quota" ON public.user_daily_quota
  FOR SELECT USING (auth.uid() = id);

-- 用户只能插入自己的配额记录
CREATE POLICY "Users can insert their own quota" ON public.user_daily_quota
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 用户只能更新自己的配额记录
CREATE POLICY "Users can update their own quota" ON public.user_daily_quota
  FOR UPDATE USING (auth.uid() = id);

-- 确保表结构正确
CREATE TABLE IF NOT EXISTS public.user_daily_quota (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_count INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0,
  quota_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_daily_quota_id ON public.user_daily_quota(id);
CREATE INDEX IF NOT EXISTS idx_user_daily_quota_date ON public.user_daily_quota(quota_date);

-- 为现有用户创建配额记录（如果不存在）
INSERT INTO public.user_daily_quota (id, pdf_count, chat_count, quota_date)
SELECT 
    u.id,
    0 as pdf_count,
    0 as chat_count,
    CURRENT_DATE as quota_date
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_daily_quota q WHERE q.id = u.id
)
ON CONFLICT (id) DO NOTHING;