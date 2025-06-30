# 🔐 环境变量配置指南

## 1. Supabase数据库设置

### 步骤1: 执行SQL脚本
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单中的 "SQL Editor"
4. 将 `supabase-setup-manual.sql` 的内容复制粘贴到编辑器中
5. 点击 "Run" 执行脚本
6. 检查执行结果，应该看到 "✅ 所有组件安装成功！" 的消息

### 步骤2: 验证安装
在SQL编辑器中运行以下查询来验证安装：

```sql
-- 检查函数是否存在
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%plus%';

-- 检查视图是否存在
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'user_with_plus';

-- 测试视图（应该返回空结果或现有用户数据）
SELECT * FROM public.user_with_plus LIMIT 5;
```

## 2. Vercel环境变量配置

### 必需的环境变量

前往 [Vercel Dashboard](https://vercel.com/dashboard) → 你的项目 → Settings → Environment Variables

#### Paddle配置
```
PADDLE_API_KEY=pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4
PADDLE_WEBHOOK_SECRET=pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP
PADDLE_ENVIRONMENT=production
PADDLE_TEST_MODE=false
```

#### Supabase配置
```
NEXT_PUBLIC_SUPABASE_URL=https://pwlvfmywfzllopuiisxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTc4OTUsImV4cCI6MjA2NDc3Mzg5NX0.g-xSF9yegK1lp9emJx4YOlJjw4BoAJZ1yz38t-r2mWc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.vUpXVr8l0-y5qTKGROKy_Tn3z0Z9sQNALkjWcMZuH-c
```

#### 其他配置（如果需要）
```
NEXTAUTH_URL=https://你的域名.vercel.app
NEXTAUTH_SECRET=生成一个随机字符串
```

### 环境变量设置步骤

1. **登录Vercel Dashboard**
   - 访问 https://vercel.com/dashboard
   - 找到你的项目

2. **进入环境变量设置**
   - 点击项目名称
   - 点击 "Settings" 标签
   - 点击左侧的 "Environment Variables"

3. **添加每个环境变量**
   - 点击 "Add New"
   - 输入变量名（例如：`PADDLE_API_KEY`）
   - 输入变量值
   - 选择环境：Production, Preview, Development（建议全选）
   - 点击 "Save"

4. **重新部署**
   - 返回 "Deployments" 标签
   - 点击最新部署旁边的三点菜单
   - 选择 "Redeploy"

## 3. Paddle Webhook配置

### 步骤1: 获取Webhook URL
你的webhook URL将是：
```
https://你的域名.vercel.app/api/webhook/paddle
```

### 步骤2: 在Paddle中配置Webhook
1. 登录 [Paddle Dashboard](https://vendors.paddle.com/)
2. 进入 "Developer Tools" → "Webhooks"
3. 点击 "Add Webhook"
4. 输入Webhook URL: `https://你的域名.vercel.app/api/webhook/paddle`
5. 选择以下事件：
   - `subscription_payment_succeeded`
   - `payment_succeeded`
   - `subscription_cancelled`
6. 保存配置

## 4. 验证部署

### 步骤1: 运行验证脚本
```bash
node scripts/verify-payment-setup.js
```

### 步骤2: 手动测试
1. **访问应用** - 确保应用正常加载
2. **登录用户** - 测试用户认证功能
3. **点击升级** - 测试支付流程开始
4. **检查Paddle跳转** - 应该能跳转到Paddle支付页面

### 步骤3: 监控日志
在Vercel Dashboard中：
1. 进入 "Functions" 标签
2. 查看API函数的执行日志
3. 确保没有环境变量错误

## 5. 故障排除

### 常见错误及解决方案

#### "Missing required Paddle environment variables"
- 检查Vercel中是否正确设置了所有Paddle环境变量
- 确保环境变量名称完全匹配（区分大小写）
- 重新部署应用

#### "Invalid signature" Webhook错误
- 确认Paddle Webhook Secret与环境变量中的值完全一致
- 检查Webhook URL是否正确配置

#### 数据库连接错误
- 验证Supabase URL和密钥是否正确
- 检查Supabase项目是否正常运行
- 确认SQL脚本已正确执行

#### Plus状态不更新
- 检查webhook是否正确接收（查看Vercel日志）
- 验证数据库函数是否正确创建
- 确认用户在数据库中存在

## 6. 安全注意事项

⚠️ **重要提醒**：
- 永远不要在代码中硬编码API密钥
- 定期轮换API密钥和Webhook密钥
- 监控异常的webhook调用
- 设置适当的日志记录但不记录敏感信息

## 7. 完成检查清单

部署完成后，确认以下项目：

- [ ] Supabase SQL脚本执行成功
- [ ] 所有环境变量在Vercel中正确设置
- [ ] Paddle Webhook URL配置正确
- [ ] 应用可以正常访问
- [ ] 支付流程可以启动
- [ ] Webhook接收正常（通过日志验证）
- [ ] Plus状态更新功能正常

🎉 **恭喜！** 如果所有检查项都通过，你的Paddle支付系统已经成功配置并可以投入使用！