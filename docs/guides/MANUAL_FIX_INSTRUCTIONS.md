# 数据库权限修复说明

## 问题描述
由于添加分享功能时RLS策略配置冲突，导致：
1. PDF分析页面无法访问（403错误）
2. 用户配额API返回权限错误
3. 数据库查询被阻止

## 解决方案

### 方法1：Supabase控制台手动修复（推荐）

1. 登录 [Supabase控制台](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 执行以下SQL语句：

```sql
-- 第一步：清理冲突的策略
DROP POLICY IF EXISTS "Allow public read for sharing" ON public.pdfs;
DROP POLICY IF EXISTS "Allow service role access" ON public.pdfs;

-- 第二步：重建PDF表基础权限策略
DROP POLICY IF EXISTS "Users can view their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can insert their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON public.pdfs;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON public.pdfs;

CREATE POLICY "Users can view their own PDFs" ON public.pdfs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDFs" ON public.pdfs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDFs" ON public.pdfs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDFs" ON public.pdfs
  FOR DELETE USING (auth.uid() = user_id);

-- 第三步：修复配额表权限
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert their own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update their own quota" ON public.user_daily_quota;

CREATE POLICY "Users can view their own quota" ON public.user_daily_quota
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own quota" ON public.user_daily_quota
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own quota" ON public.user_daily_quota
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 第四步：为分享功能创建安全策略（可选）
-- 只有在需要保留分享功能时才执行
CREATE POLICY "Allow shared PDF access" ON public.pdfs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shares 
      WHERE shares.pdf_id = pdfs.id 
      AND shares.is_active = true
      AND (shares.expires_at IS NULL OR shares.expires_at > NOW())
    )
  );

-- 第五步：创建性能索引
CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON public.pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_upload_date ON public.pdfs(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_quota_id ON public.user_daily_quota(id);
CREATE INDEX IF NOT EXISTS idx_user_daily_quota_date ON public.user_daily_quota(quota_date);
```

### 方法2：服务角色权限修复（需要额外配置）

如果上面的方法不起作用，可能需要检查服务角色权限：

1. 在Supabase控制台的 **Settings > API**
2. 确认 **Service Role Key** 有正确的权限
3. 检查 **RLS (Row Level Security)** 设置

### 方法3：临时禁用RLS（不推荐，仅用于紧急情况）

```sql
-- 临时禁用RLS（不安全，仅用于测试）
ALTER TABLE public.pdfs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota DISABLE ROW LEVEL SECURITY;
```

## 验证修复

执行SQL后，检查以下内容：

1. **PDF页面访问**：访问 `http://localhost:3000/analysis/[pdf-id]` 应该正常加载
2. **控制台错误**：浏览器控制台不应再显示403错误
3. **配额功能**：用户配额信息应该正常显示

## 预期结果

修复完成后：
- ✅ PDF分析页面正常加载
- ✅ 用户配额API正常工作
- ✅ 分享功能安全可用
- ✅ 用户只能访问自己的数据

## 注意事项

1. **备份数据**：执行SQL前建议备份重要数据
2. **测试环境**：如果可能，先在测试环境验证
3. **监控日志**：修复后观察应用日志，确认没有新的错误

## 如果仍有问题

如果执行上述SQL后问题仍然存在：

1. 检查Supabase项目的 **Database > Policies** 页面
2. 确认所有策略都已正确创建
3. 重启Next.js开发服务器
4. 清除浏览器缓存和cookie

---

**当前状态**：我已经在应用层面添加了错误处理，即使数据库权限有问题，应用也不会崩溃。但为了完全解决问题，仍需要手动执行上述SQL语句。