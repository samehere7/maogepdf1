# 🚀 Paddle支付接入与审核指南

## 📋 当前状态
- ✅ 代码集成完成
- ✅ API路由配置完成  
- ✅ Webhook处理完成
- ✅ 前端UI完成
- ⏳ 待完成Paddle账户设置和审核

## 🎯 Step 1: Paddle账户设置

### 1.1 登录Paddle Dashboard
访问：https://vendors.paddle.com/
使用你的Paddle账户登录

### 1.2 完善商家信息
进入 **Settings** → **Company Information**
- ✅ 公司名称：需要填写完整的公司/个人信息
- ✅ 地址信息：详细的营业地址
- ✅ 税务信息：税号、VAT等（如适用）
- ✅ 银行信息：用于收款的银行账户

### 1.3 配置产品和定价
进入 **Catalog** → **Products**

当前已配置的产品ID：
```
产品ID: pro_01jy64mwtctkr7632j07pasfan
产品名称: Plus Membership

月付价格ID: pri_01jy6547gd84apzec3g66ysbb5 ($11.99)
年付价格ID: pri_01jy654mn4mr07eqd3x59ya42p ($86.40)
```

确认这些ID在你的Paddle账户中存在且配置正确。

## 🎯 Step 2: Webhook配置

### 2.1 设置Webhook Endpoint
进入 **Developer Tools** → **Webhooks**

**Webhook URL**: `https://你的域名.vercel.app/api/webhook/paddle`

**需要订阅的事件**:
- ✅ `subscription_payment_succeeded` - 订阅支付成功
- ✅ `payment_succeeded` - 一次性支付成功
- ✅ `transaction.completed` - 交易完成
- ✅ `subscription_cancelled` - 订阅取消

**Webhook Secret**: 已配置为 `pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP`

### 2.2 测试Webhook
在Paddle Dashboard中发送测试webhook确保接收正常。

## 🎯 Step 3: 审核准备

### 3.1 业务合规性文档
需要准备以下页面（Paddle审核必需）：

1. **服务条款** (Terms of Service)
2. **隐私政策** (Privacy Policy)  
3. **退款政策** (Refund Policy)
4. **联系我们** (Contact Us)

### 3.2 产品描述
- 清晰描述Plus会员提供的功能
- 明确标明定价信息
- 说明续费和取消政策

### 3.3 网站要求
- ✅ 专业的网站设计
- ✅ 清晰的产品介绍
- ✅ 明确的定价页面
- ✅ 完整的法律文档

## 🎯 Step 4: 环境变量配置

### 4.1 生产环境配置 (Vercel)
在Vercel Dashboard设置以下环境变量：

```bash
# Paddle配置
PADDLE_API_KEY=pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4
PADDLE_WEBHOOK_SECRET=pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP
PADDLE_ENVIRONMENT=production
PADDLE_TEST_MODE=false

# 应用基础URL (重要：用于支付回调)
NEXT_PUBLIC_BASE_URL=https://你的域名.vercel.app
```

### 4.2 数据库配置
确保在Supabase中执行了 `supabase-setup-manual.sql`：
- ✅ `update_user_plus_status` 函数
- ✅ `user_with_plus` 视图
- ✅ 必要的RLS策略

## 🎯 Step 5: 提交审核

### 5.1 联系Paddle支持
1. 进入Paddle Dashboard
2. 点击右下角聊天图标或发送邮件到 support@paddle.com
3. 说明：**"Ready to enable checkout for production environment"**

### 5.2 提供审核信息
Paddle可能会要求：
- 网站URL
- 产品详细说明
- 预计月销售额
- 目标市场
- 合规性文档链接

### 5.3 审核时间
- 通常需要1-3个工作日
- 可能需要提供补充信息
- 审核通过后将启用checkout功能

## 🎯 Step 6: 上线后验证

### 6.1 支付测试
```bash
# 测试支付API
curl -X POST https://你的域名.vercel.app/api/payment/paddle \
  -H "Content-Type: application/json" \
  -d '{"plan":"monthly","userId":"test-user-id"}'
```

### 6.2 Webhook验证
监控生产环境日志确保webhook正常接收和处理。

### 6.3 用户体验测试
- 完整支付流程测试
- Plus功能激活验证
- 账户状态更新确认

## 🚨 重要提醒

### 安全注意事项
- ✅ 生产环境强制启用webhook签名验证
- ✅ API密钥安全保存，不要泄露
- ✅ 定期监控支付日志

### 合规要求
- ✅ 确保所有法律文档完整且最新
- ✅ 明确标示自动续费条款
- ✅ 提供清晰的取消订阅方式

### 监控建议
- 监控支付成功率
- 跟踪webhook处理状态
- 定期检查Plus用户激活情况

## 🎉 完成标志

当你看到以下情况时，说明集成成功：
- ✅ 用户可以成功完成支付
- ✅ Plus状态自动激活
- ✅ Webhook正常接收和处理
- ✅ 没有支付相关错误日志

---

**如有任何问题，请联系Paddle支持或查看Paddle文档：**
- https://developer.paddle.com/
- support@paddle.com