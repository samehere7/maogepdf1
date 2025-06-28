# 🏆 Paddle审核完整指南

## 第一步：完成网站部署

### 1. 确保网站已部署到生产环境
- ✅ 部署到Vercel/Netlify等平台
- ✅ 配置自定义域名（推荐）
- ✅ SSL证书已启用
- ✅ 所有功能正常工作

### 2. 必需页面检查
确保以下页面存在且内容完整：

- ✅ `/zh/terms-of-use` - 服务条款
- ✅ `/zh/privacy-policy` - 隐私政策  
- ✅ `/zh/about` - 关于我们页面
- ✅ 主页有清晰的产品描述
- ✅ 定价信息透明展示

## 第二步：Paddle后台配置

### 1. 完善公司信息
在 Paddle Dashboard → Account Settings 中：

```
Business Information:
- Legal Business Name: [你的公司/个人名称]
- Business Address: [完整地址]
- Tax ID/VAT: [如适用]
- Contact Email: [支持邮箱]
- Phone Number: [联系电话]
```

### 2. 配置支付信息
```
Payout Settings:
- Bank Account: [完整银行信息]
- Currency: USD
- Minimum Payout: $10
```

### 3. 设置税务信息
```
Tax Settings:
- Business Type: [个人/公司]
- Tax Residence: [居住国家]
- Tax Forms: [完成相关表格]
```

## 第三步：产品信息完善

### 1. 产品描述优化
在产品设置中添加详细描述：

```
Product Name: Plus Membership
Category: Software
Description: 
Premium PDF analysis tool with AI-powered conversation features. 
Unlock unlimited PDF uploads, unlimited AI conversations, and advanced analysis capabilities for students, researchers, and professionals.

Features:
- Unlimited PDF document uploads
- Unlimited AI-powered conversations
- Support for documents up to 2000 pages
- Advanced text analysis and insights
- Priority customer support
```

### 2. 定价信息清晰化
```
Monthly Plan:
- Price: $11.99/month
- Billing: Every month
- Features: All premium features included

Annual Plan:
- Price: $86.40/year ($7.20/month)
- Billing: Every 12 months  
- Savings: 40% compared to monthly
- Features: All premium features included
```

## 第四步：网站内容优化

### 1. 主页内容要求
确保主页包含：

```html
<!-- 清晰的价值主张 -->
<h1>AI-Powered PDF Analysis Tool</h1>
<p>Transform your PDF documents into interactive conversations with advanced AI technology.</p>

<!-- 明确的定价信息 -->
<section id="pricing">
  <h2>Simple, Transparent Pricing</h2>
  <!-- 显示月付和年付选项 -->
</section>

<!-- 功能说明 -->
<section id="features">
  <h2>Powerful Features</h2>
  <!-- 列出主要功能 -->
</section>
```

### 2. 添加支持页面（如果没有）
创建 `/zh/support` 页面：

```markdown
# 客户支持

## 联系方式
- 邮箱：maogepdf@163.com
- 响应时间：24小时内回复

## 常见问题
[添加FAQ内容]

## 技术支持
[添加技术支持信息]
```

### 3. 添加退款政策页面
创建 `/zh/refund-policy` 页面：

```markdown
# 退款政策

## Plus会员退款
- 7天无条件退款
- 按比例退款政策
- 退款处理时间：5-10个工作日

## 退款流程
1. 发送邮件申请
2. 提供订单信息
3. 等待审核
4. 处理退款
```

## 第五步：提交Paddle审核

### 1. 审核前检查清单
- ✅ 网站完全可访问
- ✅ 产品信息完整
- ✅ 法律页面完整
- ✅ 联系信息真实
- ✅ 支付流程测试通过
- ✅ Webhook配置正确

### 2. 提交审核
1. **登录Paddle Dashboard**
2. **进入 Account → Approval Status**
3. **点击 "Submit for Review"**
4. **填写审核信息**：
   ```
   Website URL: https://你的域名
   Product Type: SaaS/Digital Services
   Business Model: Subscription
   Expected Monthly Volume: [预估月交易量]
   ```

### 3. 审核时间和状态
- **审核时间**：通常1-3个工作日
- **状态跟踪**：在Dashboard中查看审核状态
- **可能的状态**：
  - Pending Review（审核中）
  - Approved（已批准）
  - Needs Attention（需要补充信息）

## 第六步：审核通过后的配置

### 1. 激活生产环境
```bash
# 更新环境变量
PADDLE_ENVIRONMENT=production
PADDLE_TEST_MODE=false
```

### 2. 最终测试
- 测试真实支付流程
- 确认webhook正常工作
- 验证Plus状态更新

### 3. 监控设置
- 设置支付监控
- 配置错误报告
- 建立客服流程

## 第七步：常见审核问题及解决

### 1. 网站内容不完整
**问题**：缺少法律页面或联系信息
**解决**：
- 完善服务条款和隐私政策
- 添加真实的联系方式
- 确保所有链接都可访问

### 2. 产品描述不清晰
**问题**：产品功能说明模糊
**解决**：
- 详细描述产品功能
- 添加使用场景说明
- 提供清晰的定价信息

### 3. 业务信息不匹配
**问题**：网站信息与Paddle账户信息不一致
**解决**：
- 确保公司名称一致
- 统一联系信息
- 核对地址信息

### 4. 支付流程问题
**问题**：测试支付无法完成
**解决**：
- 检查结账链接配置
- 验证webhook设置
- 测试完整支付流程

## 📞 获得帮助

### Paddle支持渠道
- **Help Center**: https://paddle.com/help
- **Email Support**: support@paddle.com
- **Live Chat**: 在Dashboard中可用

### 提交支持票据时包含：
- 账户ID
- 问题详细描述
- 相关截图
- 错误日志（如有）

## 🎉 审核通过！

审核通过后你就可以：
- ✅ 接受真实的客户支付
- ✅ 自动处理订阅管理
- ✅ 享受Paddle的全套服务
- ✅ 专注于产品开发和用户获取

---

**记住**：Paddle审核是为了保护所有用户，确保提供真实、高质量的服务。按照这个指南操作，大部分情况下都能顺利通过审核！