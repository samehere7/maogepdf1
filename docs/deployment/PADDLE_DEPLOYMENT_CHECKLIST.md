# 🚀 Paddle生产部署检查清单

## 📋 部署前检查清单

### ✅ 代码准备
- [x] 支付API集成完成 (`/api/payment/paddle`)
- [x] Webhook处理完成 (`/api/webhook/paddle`)
- [x] 前端支付组件完成 (`UpgradePlusModal.tsx`)
- [x] 数据库函数配置 (`update_user_plus_status`)
- [x] 错误处理和日志完善
- [x] 生产环境配置就绪

### ✅ 法律页面
- [x] 服务条款 (`/terms`)
- [x] 隐私政策 (`/privacy`)
- [x] 退款政策 (`/refund`)  
- [x] 联系我们 (`/contact`)

### ⏳ Paddle账户配置
- [ ] 商家信息完善
- [ ] 银行账户设置
- [ ] 税务信息配置
- [ ] 产品和价格确认
- [ ] Webhook endpoint设置
- [ ] 提交审核申请

### ⏳ 环境变量配置 (Vercel)
- [ ] `PADDLE_API_KEY` - 生产环境API密钥
- [ ] `PADDLE_WEBHOOK_SECRET` - Webhook签名密钥
- [ ] `PADDLE_ENVIRONMENT=production`
- [ ] `PADDLE_TEST_MODE=false`
- [ ] `NEXT_PUBLIC_BASE_URL` - 生产域名

### ⏳ 数据库配置 (Supabase)
- [ ] 执行 `supabase-setup-manual.sql`
- [ ] 验证数据库函数正常工作
- [ ] 确认RLS策略配置正确

## 🎯 Paddle账户设置步骤

### 1. 完善商家信息
```
登录 https://vendors.paddle.com/
→ Settings → Company Information
→ 填写完整的公司/个人信息
→ 上传必要的身份证明文件
```

### 2. 配置银行信息
```
→ Settings → Payout Settings
→ 添加银行账户信息
→ 设置收款偏好
```

### 3. 确认产品配置
```
→ Catalog → Products
→ 确认产品: Plus Membership (pro_01jy64mwtctkr7632j07pasfan)
→ 确认价格: 
  - 月付: pri_01jy6547gd84apzec3g66ysbb5 ($11.99)
  - 年付: pri_01jy654mn4mr07eqd3x59ya42p ($86.40)
```

### 4. 设置Webhook
```
→ Developer Tools → Webhooks
→ 添加新的Webhook endpoint
→ URL: https://你的域名.vercel.app/api/webhook/paddle
→ 选择事件:
  ✅ subscription_payment_succeeded
  ✅ payment_succeeded  
  ✅ transaction.completed
  ✅ subscription_cancelled
→ Secret: pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP
```

## 🚀 部署流程

### 步骤 1: 推送代码到Git仓库
```bash
git add .
git commit -m "🚀 完成Paddle生产环境集成和法律页面"
git push origin main
```

### 步骤 2: Vercel环境变量配置
在 Vercel Dashboard → Settings → Environment Variables 添加：

```bash
PADDLE_API_KEY=pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4
PADDLE_WEBHOOK_SECRET=pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP
PADDLE_ENVIRONMENT=production
PADDLE_TEST_MODE=false
NEXT_PUBLIC_BASE_URL=https://你的实际域名.vercel.app
```

### 步骤 3: 触发重新部署
```bash
# 在Vercel Dashboard点击 "Redeploy"
# 或推送一个新的commit触发自动部署
```

### 步骤 4: Supabase数据库配置
```sql
-- 在Supabase Dashboard → SQL Editor 执行
-- 复制 supabase-setup-manual.sql 的全部内容
-- 确保看到 "✅ 所有组件安装成功！" 消息
```

### 步骤 5: 提交Paddle审核
```
1. 发送邮件到 support@paddle.com
2. 主题: Request to enable checkout for production
3. 内容包含:
   - 网站URL: https://你的域名.vercel.app
   - 产品描述: AI-powered PDF document analysis platform
   - 目标市场: Global
   - 预计月销售额: $XXX
   - 法律页面链接:
     * Terms: https://你的域名.vercel.app/terms
     * Privacy: https://你的域名.vercel.app/privacy  
     * Refund: https://你的域名.vercel.app/refund
     * Contact: https://你的域名.vercel.app/contact
```

## 🧪 部署后测试

### 1. 基础功能测试
```bash
# 测试支付API (应该返回Paddle错误)
curl -X POST https://你的域名.vercel.app/api/payment/paddle \
  -H "Content-Type: application/json" \
  -d '{"plan":"monthly","userId":"test"}'

# 期望结果: Paddle checkout尚未启用的错误
```

### 2. Webhook测试
```bash
# 在Paddle Dashboard发送测试webhook
# 检查 Vercel Functions 日志确认接收
```

### 3. 页面访问测试
- [ ] https://你的域名.vercel.app/terms
- [ ] https://你的域名.vercel.app/privacy
- [ ] https://你的域名.vercel.app/refund
- [ ] https://你的域名.vercel.app/contact

## 📧 提交审核邮件模板

```
To: support@paddle.com
Subject: Request to enable checkout for production - MaogePDF

Hello Paddle Team,

I would like to request enabling checkout functionality for my production environment.

Business Details:
- Business Name: MaogePDF
- Website: https://你的域名.vercel.app
- Product: AI-powered PDF document analysis and chat platform
- Target Market: Global users, primarily professionals and researchers

Product Information:
- Service: Plus membership subscription
- Monthly Plan: $11.99/month
- Annual Plan: $86.40/year (40% discount)
- Features: Unlimited PDF processing, unlimited AI chat, premium models

Legal Compliance:
- Terms of Service: https://你的域名.vercel.app/terms
- Privacy Policy: https://你的域名.vercel.app/privacy
- Refund Policy: https://你的域名.vercel.app/refund
- Contact Information: https://你的域名.vercel.app/contact

Technical Setup:
- Webhook Endpoint: https://你的域名.vercel.app/api/webhook/paddle
- API Integration: Completed using Paddle Node.js SDK v2.8.0
- Product IDs: pro_01jy64mwtctkr7632j07pasfan
- Price IDs: pri_01jy6547gd84apzec3g66ysbb5, pri_01jy654mn4mr07eqd3x59ya42p

Please let me know if you need any additional information or documentation.

Best regards,
[你的姓名]
[你的邮箱]
```

## 🎉 审核通过后

### 验证支付功能
1. 访问应用并登录
2. 点击升级到Plus
3. 完成真实支付测试 (建议小额测试)
4. 确认Plus状态正确激活
5. 监控webhook日志

### 监控重点
- 支付成功率
- Webhook接收状态  
- Plus用户激活状态
- 错误日志监控

---

**估计时间线:**
- 代码部署: 1小时
- Paddle配置: 2-4小时  
- 审核等待: 1-3个工作日
- 测试验证: 1小时

**现在就开始部署吧！** 🚀