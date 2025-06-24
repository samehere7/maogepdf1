# 🔧 快速调试指南

## 🚀 调试链接

### 主要调试页面
```
https://www.maogepdf.com/zh/debug
```

### API 调试端点
```
https://www.maogepdf.com/api/debug
```

## 📋 使用方法

### 1. 访问调试页面
1. 打开浏览器，访问: https://www.maogepdf.com/zh/debug
2. 点击"开始全面诊断"按钮
3. 等待所有测试完成（约30秒）
4. 截图或复制所有结果

### 2. 测试项目包括
- ✅ Supabase 连接状态
- ✅ JWT Token 分析（检查缺失字段）
- ✅ 用户配置文件 API 测试
- ✅ 用户配额 API 测试  
- ✅ PDF 列表 API 测试
- ✅ 支付 API 测试
- ✅ 健康检查 API 测试
- ✅ 环境变量配置检查

### 3. 快速问题识别

#### 如果看到 JWT Token 问题：
```
❌ JWT Token 分析
包含 sub: 否
包含 aud: 否
```
**解决方案**: 这确认了 JWT 缺失字段问题

#### 如果看到 API 500 错误：
```
❌ 用户配置文件 API
状态: 500, 错误: Internal Server Error
```
**解决方案**: 检查 Supabase RLS 策略

#### 如果看到认证失败：
```
❌ Supabase 连接
连接失败: Invalid JWT
```
**解决方案**: 检查 service role key 配置

## 🎯 发送调试信息

### 完整诊断结果
运行调试页面后，将以下信息发送给开发者：

1. **所有测试结果截图**
2. **浏览器控制台错误日志**
3. **网络请求详情**（F12 → Network 标签）

### 快速信息模板
```
调试时间: [时间]
用户状态: [已登录/未登录]
问题描述: [具体错误]

测试结果:
- Supabase 连接: [成功/失败]
- JWT Token: [正常/缺失字段]
- API 状态: [具体错误码]
- 环境变量: [配置状态]
```

## 🔍 高级调试

### 直接 API 测试
如果调试页面无法访问，可以直接测试 API：

```bash
# 健康检查
curl https://www.maogepdf.com/api/health

# 调试信息
curl https://www.maogepdf.com/api/debug

# 用户配置（需要登录token）
curl -H "Authorization: Bearer YOUR_TOKEN" https://www.maogepdf.com/api/user/profile
```

### Supabase 数据库检查
在 Supabase SQL 编辑器中运行：

```sql
-- 检查RLS策略
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_daily_quota', 'plus');

-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_daily_quota', 'plus');
```

## ⚡ 常见问题快速修复

### 问题1: 支付处理失败
**症状**: "支付处理失败，请稍后重试"
**快速检查**: 
1. 访问调试页面，查看支付 API 测试结果
2. 检查 PADDLE_TEST_MODE 是否为 true

### 问题2: 500 Internal Server Error
**症状**: 多个 API 返回 500 错误
**快速检查**:
1. 访问调试页面，查看所有 API 测试结果
2. 特别关注 Supabase 连接和 service role 测试

### 问题3: 用户信息无法加载
**症状**: 登录后看不到用户信息
**快速检查**:
1. 访问调试页面，查看 JWT Token 分析
2. 检查用户配置文件 API 测试结果

## 📞 联系支持

发送调试结果时，请包含：
1. 完整的调试页面截图
2. 浏览器控制台截图
3. 网络请求截图
4. 问题发生的具体步骤

---

**调试页面链接**: https://www.maogepdf.com/zh/debug

**立即开始诊断，快速定位问题！**