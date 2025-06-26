# 🔧 Vercel 环境变量配置指南

## 📋 必需环境变量

将以下环境变量添加到您的 Vercel 项目设置中：

### 1. Supabase 配置
```bash
NEXT_PUBLIC_SUPABASE_URL=https://pwlvfmywfzllopuiisxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTc4OTUsImV4cCI6MjA2NDc3Mzg5NX0.g-xSF9yegK1lp9emJx4YOlJjw4BoAJZ1yz38t-r2mWc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.CkPzDehpjCsiH7ZpLPtu8LUZzr5q1w4iTHp-Z_bobLk
DATABASE_URL=postgresql://postgres:Nlx9iOYZtghqQO0X@db.pwlvfmywfzllopuiisxg.supabase.co:5432/postgres?sslmode=require&pool_timeout=10&connection_limit=10&connect_timeout=30
```

### 2. AI 服务配置
```bash
OPENROUTER_API_KEY=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
```

### 3. Paddle 支付配置
```bash
PADDLE_API_KEY=pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4
PADDLE_WEBHOOK_SECRET=pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP
PADDLE_ENVIRONMENT=production
PADDLE_TEST_MODE=false
```

### 4. 应用配置
```bash
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://你的域名.vercel.app
PUPPETEER_SKIP_DOWNLOAD=true
```

## 🚀 快速配置方法

### 方式一：通过 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 设置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATABASE_URL
vercel env add OPENROUTER_API_KEY
vercel env add PADDLE_API_KEY
vercel env add PADDLE_WEBHOOK_SECRET
vercel env add PADDLE_ENVIRONMENT
vercel env add PADDLE_TEST_MODE
vercel env add NODE_ENV
vercel env add NEXT_PUBLIC_BASE_URL
vercel env add PUPPETEER_SKIP_DOWNLOAD
```

### 方式二：通过 Vercel Dashboard
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 Settings → Environment Variables
4. 添加上述所有环境变量

## 📝 配置步骤

1. **复制环境变量**：从上面的列表复制所有必需的环境变量

2. **更新域名**：将 `NEXT_PUBLIC_BASE_URL` 更新为您的实际域名

3. **验证配置**：确保所有变量都已正确设置

4. **重新部署**：设置完环境变量后重新部署项目

## ⚠️ 重要提醒

- **安全性**：这些密钥包含敏感信息，请妥善保管
- **环境区分**：确保生产环境使用正确的密钥
- **定期更新**：建议定期轮换API密钥
- **Webhook更新**：部署后需要在Paddle中更新webhook URL

## 🔍 验证配置

部署后，您可以通过以下方式验证配置：

1. **访问网站**：确认网站能正常加载
2. **测试功能**：
   - 用户注册/登录
   - PDF上传
   - AI聊天
   - 支付流程
3. **检查日志**：在 Vercel Dashboard 中查看部署日志

## 🆘 常见问题

### 问题1：数据库连接失败
- 检查 `DATABASE_URL` 是否正确
- 确认网络连接正常

### 问题2：AI服务不可用
- 验证 `OPENROUTER_API_KEY` 是否有效
- 检查API配额是否充足

### 问题3：支付功能异常
- 确认 Paddle 配置正确
- 检查 webhook URL 设置

---

**注意**：设置完所有环境变量后，需要重新部署项目以使配置生效。