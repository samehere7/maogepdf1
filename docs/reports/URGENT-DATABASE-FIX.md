# 🚨 紧急数据库权限修复指南

## 问题描述
用户遇到 403 Forbidden 错误，无法访问 `user_profiles` 和 `user_daily_quota` 表。根源是 JWT token 缺少必要的 `aud` 和 `sub` 字段，导致 `auth.uid()` 函数无法正常工作。

## ✅ 解决方案

### 第一步：在 Supabase SQL 编辑器中执行修复脚本

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 执行以下脚本：`fix-rls-for-current-jwt.sql`

### 第二步：验证修复

执行以下 SQL 验证策略是否正确应用：

```sql
-- 查看当前 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'user_daily_quota', 'plus')
ORDER BY tablename, policyname;

-- 验证函数是否创建成功
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_profile', 'get_user_daily_quota');
```

### 第三步：测试应用程序

修复完成后，应用程序将：
- 通过 API 端点安全地访问用户数据
- 绕过有问题的 JWT 验证
- 保持完整的安全性（通过 service_role 访问）

## 🔧 技术详情

### 修复内容：
1. **新的 RLS 策略**：只允许 service_role 访问数据表
2. **安全函数**：创建了 `get_user_profile` 和 `get_user_daily_quota` 函数
3. **API 端点**：`/api/user/profile` 和 `/api/user/quota` 进行安全的数据访问
4. **应用程序更新**：所有组件现在使用 API 端点而不是直接数据库查询

### 安全保证：
- 所有数据访问都通过验证用户身份的 API 端点
- 保持行级安全（RLS）启用
- 使用 service_role 进行安全的数据库操作
- 应用层面验证用户权限

## 📋 执行清单

- [ ] 在 Supabase SQL 编辑器中执行 `fix-rls-for-current-jwt.sql`
- [ ] 验证 RLS 策略和函数创建成功
- [ ] 部署应用程序更新
- [ ] 测试用户登录和数据访问
- [ ] 确认 403 错误已解决

## 🎯 预期结果

修复完成后：
- ✅ 用户可以正常登录和访问个人数据
- ✅ 不再出现 403 Forbidden 错误
- ✅ 所有功能（账户信息、配额查看、Plus状态）正常工作
- ✅ 保持完整的安全性和数据隔离

## 📞 支持

如果执行过程中遇到问题，请查看：
1. Supabase 控制台的错误日志
2. 浏览器开发者工具的网络请求
3. 应用程序控制台日志

修复脚本已经过测试，应该能解决当前的权限问题。