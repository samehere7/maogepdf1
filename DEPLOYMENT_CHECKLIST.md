# 🚀 MaogePDF 部署检查清单

## 📋 部署前检查

### ✅ 1. 项目状态检查
- [x] 项目构建成功 (`npm run build`)
- [x] 系统提示词模板功能完成
- [x] 没有关键语法错误
- [ ] 安全漏洞修复（建议更新Next.js和pdf.js）

### 🔑 2. 环境变量配置（生产环境）

#### Supabase 配置
```bash
NEXT_PUBLIC_SUPABASE_URL=https://pwlvfmywfzllopuiisxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTc4OTUsImV4cCI6MjA2NDc3Mzg5NX0.g-xSF9yegK1lp9emJx4YOlJjw4BoAJZ1yz38t-r2mWc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.CkPzDehpjCsiH7ZpLPtu8LUZzr5q1w4iTHp-Z_bobLk
DATABASE_URL=postgresql://postgres:Nlx9iOYZtghqQO0X@db.pwlvfmywfzllopuiisxg.supabase.co:5432/postgres?sslmode=require&pool_timeout=10&connection_limit=10&connect_timeout=30
```

#### AI 服务配置
```bash
OPENROUTER_API_KEY=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
```

#### Paddle 支付配置
```bash
PADDLE_API_KEY=pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4
PADDLE_WEBHOOK_SECRET=pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP
PADDLE_ENVIRONMENT=production
PADDLE_TEST_MODE=false
```

#### 应用配置
```bash
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://你的域名.com
PUPPETEER_SKIP_DOWNLOAD=true
```

### 🗄️ 3. 数据库状态
- [x] Supabase项目已创建
- [x] Prisma schema已同步
- [x] RLS策略已配置
- [x] 聊天记录表已创建

### 🔧 4. Vercel配置
- [x] vercel.json配置文件已准备
- [x] 构建命令配置正确
- [ ] 域名配置
- [ ] 环境变量配置

## 🚀 部署步骤

### 方式一：Vercel CLI部署

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署到Vercel**
```bash
vercel
```

4. **配置环境变量**
```bash
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

5. **重新部署**
```bash
vercel --prod
```

### 方式二：GitHub连接自动部署

1. **推送代码到GitHub**
```bash
git add .
git commit -m "准备生产环境部署"
git push origin main
```

2. **连接Vercel项目**
- 访问 https://vercel.com
- 导入GitHub仓库
- 配置环境变量
- 自动部署

## ⚠️ 部署后检查

### 功能测试
- [ ] 用户注册/登录功能
- [ ] PDF上传功能
- [ ] PDF聊天功能
- [ ] 多语言切换
- [ ] 闪卡创建功能
- [ ] 支付功能测试

### 性能检查
- [ ] 页面加载速度
- [ ] API响应时间
- [ ] 数据库查询性能

### 安全检查
- [ ] HTTPS证书配置
- [ ] 环境变量安全性
- [ ] API端点安全性

## 🔍 监控设置

### 错误监控
- [ ] 配置Vercel Analytics
- [ ] 设置错误报告
- [ ] 日志监控

### 性能监控
- [ ] Core Web Vitals监控
- [ ] API响应时间监控
- [ ] 数据库性能监控

## 📝 部署记录

| 日期 | 版本 | 部署者 | 变更内容 | 状态 |
|------|------|--------|----------|------|
| 2025-06-26 | v1.0.0 | Claude | 初始生产环境部署 | 准备中 |

## 🚨 回滚计划

如果部署出现问题：

1. **快速回滚**
```bash
vercel rollback
```

2. **数据库回滚**
- 检查数据库迁移状态
- 必要时恢复数据库备份

3. **DNS回滚**
- 恢复原域名配置

## 📞 支持联系

- 技术支持：[技术支持邮箱]
- 紧急联系：[紧急联系方式]

---

**注意**: 在生产环境部署前，请确保所有检查项都已完成！