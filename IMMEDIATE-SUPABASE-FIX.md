# 🚨 立即执行 - Supabase 数据库修复

## 当前问题
您的网站现在出现 500 错误，因为数据库权限策略有冲突。需要立即在 Supabase 中执行修复脚本。

## 🚀 紧急修复步骤

### 第一步：访问 Supabase SQL 编辑器
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目（pwlvfmywfzllopuiisxg）
3. 进入 **SQL Editor** 标签

### 第二步：执行紧急修复脚本
复制以下 SQL 脚本，粘贴到 SQL 编辑器中并执行：

```sql
-- 紧急修复：清理所有冲突的RLS策略并创建新的安全策略
-- 这个脚本将解决当前的500错误问题

-- 第一步：清理所有现有的RLS策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_owner_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_service_role_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow function access to user_profiles" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Service role full access to user_daily_quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "quota_owner_policy" ON public.user_daily_quota;
DROP POLICY IF EXISTS "quota_service_role_policy" ON public.user_daily_quota;

DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can update own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can insert own plus status" ON public.plus;
DROP POLICY IF EXISTS "Service role full access to plus" ON public.plus;
DROP POLICY IF EXISTS "plus_owner_policy" ON public.plus;
DROP POLICY IF EXISTS "plus_service_role_policy" ON public.plus;
DROP POLICY IF EXISTS "Allow function access to plus" ON public.plus;

-- 第二步：创建简单有效的service_role策略
CREATE POLICY "service_role_access_user_profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_access_user_daily_quota" ON public.user_daily_quota
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_access_plus" ON public.plus
  FOR ALL USING (auth.role() = 'service_role');

-- 第三步：确保RLS启用
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;

-- 验证策略创建
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_daily_quota', 'plus')
ORDER BY tablename, policyname;
```

### 第三步：验证修复结果
执行后，您应该看到：
- 查询结果显示新创建的策略
- 3个表都有 `service_role_access_*` 策略

### 第四步：测试网站功能
1. 刷新您的网站：https://www.maogepdf.com
2. 尝试登录
3. 检查用户配置文件是否正常加载
4. 验证 PDF 列表是否显示

## 🎯 预期结果

修复后：
- ✅ 用户可以正常登录
- ✅ 不再出现 500 Internal Server Error
- ✅ 用户配置文件正常显示
- ✅ PDF 列表正常加载
- ✅ 支付功能恢复正常

## 🚨 如果仍有问题

如果执行后仍有错误，请：
1. 检查 Supabase 控制台是否有错误消息
2. 确认所有策略都已创建
3. 重新刷新网站页面

---

**请立即执行这个修复脚本，修复后网站应该恢复正常！**