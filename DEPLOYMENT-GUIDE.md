# 🚀 完整部署和Paddle审核指南

## 第一部分：Vercel部署步骤

### 1. 准备Git仓库
```bash
# 如果还没有提交到Git
git add .
git commit -m "准备生产部署：完成Paddle支付集成"
git push origin main
```

### 2. 部署到Vercel

#### 方式一：通过Vercel网站（推荐）
1. **访问 Vercel**：https://vercel.com
2. **登录/注册账户**
3. **点击 "New Project"**
4. **导入Git仓库**：
   - 选择你的GitHub/GitLab仓库
   - 选择 `maoge-pdf` 项目
5. **配置项目**：
   - Framework Preset: Next.js
   - Root Directory: `/`（默认）
   - Build Command: `npm run build`（默认）
   - Output Directory: `.next`（默认）

#### 方式二：通过Vercel CLI
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 3. 配置环境变量

在Vercel项目设置中添加以下环境变量：

**Settings → Environment Variables**

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
DATABASE_URL=你的数据库连接字符串

# NextAuth配置
NEXTAUTH_URL=https://你的域名.vercel.app
NEXTAUTH_SECRET=生成一个随机字符串

# Google OAuth
GOOGLE_CLIENT_ID=你的Google Client ID
GOOGLE_CLIENT_SECRET=你的Google Client Secret

# Paddle配置（稍后添加）
PADDLE_VENDOR_ID=待填写
PADDLE_API_KEY=待填写
PADDLE_WEBHOOK_SECRET=待填写
PADDLE_ENVIRONMENT=production
PADDLE_TEST_MODE=false

# OpenRouter API（如果使用）
OPENROUTER_API_KEY=你的OpenRouter密钥
```

### 4. 自定义域名（可选但推荐）
1. **在Vercel项目设置中**：Settings → Domains
2. **添加你的域名**：例如 `yourapp.com`
3. **配置DNS记录**：按照Vercel提供的说明配置

## 第二部分：Paddle完整配置

### 1. 登录Paddle控制台
访问：https://vendors.paddle.com

### 2. 完成账户验证
- **Business Information**：填写公司/个人信息
- **Tax Information**：填写税务信息
- **Payout Methods**：添加银行账户信息

### 3. 创建产品和价格

#### 步骤A：创建产品
1. **进入 Catalog → Products**
2. **点击 "+ Create product"**
3. **填写信息**：
   ```
   Product Name: Plus Membership
   Description: Premium PDF analysis and chat features with unlimited usage
   Product Type: Subscription
   Category: Software
   ```

#### 步骤B：创建价格计划
**月付计划**：
```
Amount: $11.99
Currency: USD
Billing Cycle: Monthly
Trial Days: 0（或者7天试用）
```

**年付计划**：
```
Amount: $86.40
Currency: USD  
Billing Cycle: Yearly
Trial Days: 0
```

### 4. 创建结账链接

#### 月付结账链接
1. **进入 Checkout → Checkout Links**
2. **"+ Create checkout link"**
3. **配置**：
   ```
   Name: Monthly Plus Subscription
   Products: 选择刚创建的Plus Membership产品
   Prices: 选择月付价格
   Allow Quantity: No
   Checkout Settings:
   - Show quantity selector: No
   - Allow promo codes: Yes (optional)
   - Collect customer address: No
   ```

#### 年付结账链接
重复上述步骤，选择年付价格

### 5. 配置Webhook
1. **进入 Developer Tools → Notifications**
2. **"+ Add endpoint"**
3. **配置**：
   ```
   Endpoint Name: Production Webhooks
   Endpoint URL: https://你的域名/api/webhook/paddle
   
   Events to subscribe:
   ☑️ subscription.created
   ☑️ subscription.updated
   ☑️ subscription.canceled
   ☑️ transaction.completed
   ☑️ transaction.updated
   ```

### 6. 获取API凭据
1. **进入 Developer Tools → Authentication**
2. **记录以下信息**：
   - Vendor ID
   - API Key（创建新的）
   - Webhook Secret（从上一步的webhook配置中获取）

## 第三部分：更新代码配置

### 1. 更新支付API中的结账链接

```typescript
// 在 app/api/payment/paddle/route.ts 中更新
if (plan === 'monthly') {
  checkoutUrl = '你的新月付结账链接'
} else if (plan === 'yearly') {
  checkoutUrl = '你的新年付结账链接'
}
```

### 2. 在Vercel中更新环境变量
将Paddle的凭据添加到Vercel环境变量中。

### 3. 重新部署
```bash
# 提交更改
git add .
git commit -m "更新Paddle生产配置"
git push origin main

# Vercel会自动重新部署
```

## 第四部分：Paddle审核准备

### 1. 网站内容要求

#### A. 必需页面
确保以下页面存在且内容完整：

**服务条款 (`/terms-of-use`)**：
- 服务描述
- 用户权利和义务
- 付费服务条款
- 退款政策
- 责任限制

**隐私政策 (`/privacy-policy`)**：
- 数据收集说明
- 数据使用方式
- 第三方服务（Google OAuth, Paddle支付）
- Cookie政策
- 用户权利

**联系我们页面**：
- 客服邮箱
- 公司地址（如适用）
- 响应时间承诺

#### B. 产品信息透明度
- 清晰的功能说明
- 明确的价格展示
- 订阅条款说明
- 取消政策

### 2. 创建必要的法律文档

创建或更新以下文件：