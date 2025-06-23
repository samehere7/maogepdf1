# Paddle支付集成部署指南

## 🔧 必需的环境变量

在生产环境和开发环境中，必须设置以下环境变量：

### Paddle配置
```bash
# Paddle API密钥 (从Paddle控制台获取)
PADDLE_API_KEY=your_paddle_api_key_here

# Paddle Webhook密钥 (从Paddle控制台获取)
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here

# Paddle环境设置
PADDLE_ENVIRONMENT=production  # 或 sandbox 用于测试
PADDLE_TEST_MODE=false        # 设为true启用测试模式
```

### 数据库配置
```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📋 部署清单

### 1. 环境变量配置
- [ ] 在Vercel中设置所有必需的环境变量
- [ ] 确认Paddle环境变量已正确配置
- [ ] 验证Supabase连接配置

### 2. 数据库设置
- [ ] 在Supabase SQL编辑器中运行 `database-functions.sql`
- [ ] 在Supabase SQL编辑器中运行 `create-user-with-plus-view.sql`
- [ ] 验证数据库函数和视图创建成功

### 3. Paddle配置
- [ ] 在Paddle控制台配置webhook URL: `https://your-domain.com/api/webhook/paddle`
- [ ] 测试webhook签名验证
- [ ] 确认产品和价格配置正确

### 4. 测试流程
- [ ] 测试支付API端点 (`/api/payment/paddle`)
- [ ] 测试webhook接收 (`/api/webhook/paddle`)
- [ ] 验证Plus状态更新功能
- [ ] 端到端支付测试

## 🔍 验证步骤

### 1. 检查配置
```bash
# 访问 /api/health 检查服务状态
curl https://your-domain.com/api/health

# 测试支付API (需要有效用户会话)
curl -X POST https://your-domain.com/api/payment/paddle \
  -H "Content-Type: application/json" \
  -d '{"plan": "monthly", "userId": "test-user-id"}'
```

### 2. 数据库验证
在Supabase SQL编辑器中运行：
```sql
-- 检查函数是否存在
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('update_user_plus_status', 'get_user_plus_status');

-- 检查视图是否存在
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'user_with_plus';

-- 测试函数
SELECT update_user_plus_status(
  'test-user-id'::UUID,
  true,
  true,
  (NOW() + INTERVAL '1 month')::TIMESTAMPTZ,
  'monthly'
);
```

### 3. 支付流程测试
1. 登录应用
2. 点击升级到Plus
3. 选择支付计划
4. 完成Paddle支付流程
5. 验证Plus状态更新

## 🚨 常见问题

### 问题1: "Missing required Paddle environment variables"
**解决方案**: 确保在环境变量中设置了 `PADDLE_API_KEY` 和 `PADDLE_WEBHOOK_SECRET`

### 问题2: "Invalid API key" 数据库连接失败
**解决方案**: 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否正确设置

### 问题3: "Invalid signature" webhook验证失败
**解决方案**: 
- 确认 `PADDLE_WEBHOOK_SECRET` 与Paddle控制台中的设置一致
- 检查webhook URL配置是否正确

### 问题4: Plus状态不更新
**解决方案**:
- 检查数据库函数是否正确创建
- 验证RLS策略设置
- 查看服务器日志中的错误信息

## 📄 相关文件

- `config/paddle.ts` - Paddle配置
- `app/api/payment/paddle/route.ts` - 支付API
- `app/api/webhook/paddle/route.ts` - Webhook处理
- `database-functions.sql` - 数据库函数
- `create-user-with-plus-view.sql` - 数据库视图
- `components/UpgradePlusModal.tsx` - 升级界面

## 🔄 更新日志

### 版本 2.0 (当前)
- ✅ 移除硬编码API密钥安全漏洞
- ✅ 启用强制webhook签名验证
- ✅ 改进数据库函数和视图
- ✅ 修复价格显示精度问题
- ✅ 增强错误处理和用户体验
- ✅ 添加完整的配置验证

### 版本 1.0 (原始)
- 基本Paddle集成
- 简单的支付流程
- 基础Plus状态管理