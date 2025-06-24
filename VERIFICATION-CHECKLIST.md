# 🔍 问题修复验证清单

## ✅ 已完成的修复

### 1. 数据库权限问题 (403 Forbidden)
- **问题**：JWT token 缺少 `aud` 和 `sub` 字段导致 RLS 策略失效
- **解决方案**：
  - ✅ 创建了 `fix-rls-for-current-jwt.sql` 脚本
  - ✅ 建立了基于 service_role 的安全 RLS 策略
  - ✅ 创建了 `/api/user/profile` 和 `/api/user/quota` API 端点
  - ✅ 修改了 UserProvider、SidebarUserInfo、AccountModal 使用 API 端点
  - ✅ 更新了 chat API 使用 service role 客户端

### 2. API 认证问题
- **问题**：`/api/pdfs` 返回 500 错误，缺少认证头
- **解决方案**：
  - ✅ 修改了 `/api/pdfs` 路由使用 Bearer token 认证
  - ✅ 更新了 sidebar.tsx 在请求中包含认证头

### 3. 支付 API 状态
- **检查结果**：`/api/payment/paddle` 配置正确，测试模式启用
- **状态**：✅ 配置完整，应该在测试模式下正常工作

## 🧪 验证步骤

### 第一步：数据库权限验证
1. 在 Supabase SQL 编辑器中执行：`fix-rls-for-current-jwt.sql`
2. 验证策略是否正确创建：
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_daily_quota');
```

### 第二步：应用程序功能验证
访问 https://www.maogepdf.com 并测试：

- [ ] **用户登录**：Google OAuth 登录是否正常
- [ ] **个人信息**：点击用户头像，查看账户信息是否加载
- [ ] **PDF 列表**：左侧边栏是否显示用户的 PDF 文件
- [ ] **配额显示**：非 Plus 用户是否能看到使用配额
- [ ] **Plus 状态**：Plus 会员状态是否正确显示

### 第三步：错误检查
在浏览器开发者工具中：

- [ ] **控制台错误**：不应再出现 403 Forbidden 错误
- [ ] **网络请求**：
  - `/api/user/profile` 应返回 200
  - `/api/user/quota` 应返回 200
  - `/api/pdfs` 应返回 200
- [ ] **认证状态**：用户信息应正确加载和显示

## 🚨 如果仍有问题

### 数据库权限问题持续
1. 检查 RLS 脚本是否成功执行
2. 验证 Supabase service role key 是否正确配置
3. 检查应用程序日志中的具体错误信息

### API 错误持续
1. 检查浏览器网络请求是否包含 Authorization 头
2. 验证 access_token 是否有效
3. 查看服务端日志中的详细错误信息

## 📋 环境配置确认

确保以下环境变量正确配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_TEST_MODE=true`

## 🎯 预期结果

修复完成后：
- ✅ 用户可以正常登录和访问个人数据
- ✅ 不再出现 403 Forbidden 错误
- ✅ PDF 列表正常加载
- ✅ 账户信息和配额正确显示
- ✅ Plus 会员状态准确反映
- ✅ 所有认证相关功能正常工作

## 📞 技术支持

如果问题持续，请提供：
1. 具体的错误消息
2. 浏览器控制台截图
3. 网络请求详情
4. 用户登录状态信息