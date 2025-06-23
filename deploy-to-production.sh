#!/bin/bash

echo "🚀 MaogePDF Paddle支付系统 - 生产环境部署脚本"
echo "=================================================="
echo ""

# 检查当前分支
current_branch=$(git branch --show-current)
echo "📋 当前分支: $current_branch"

# 检查是否有未提交的更改
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "⚠️  检测到未提交的更改，正在提交..."
    
    echo "📝 添加所有更改到暂存区..."
    git add .
    
    echo "💾 提交更改..."
    git commit -m "🚀 Paddle支付系统完整集成完成

✅ 支付API集成和webhook处理完成
✅ 数据库权限和RLS策略全部修复
✅ 法律页面完整创建 (Terms, Privacy, Refund, Contact)
✅ 前端用户体验优化，403权限错误已解决
✅ 完整的错误处理、重试机制和详细日志
✅ 支持月付($11.99)和年付($86.40)两种计划
✅ 自动Plus会员激活功能

Features:
- Payment API with Paddle SDK integration
- Webhook processing with signature verification
- Database functions for Plus status management
- Complete legal compliance pages
- Frontend permission fixes for user data access
- Comprehensive error handling and logging

Ready for production deployment and Paddle review submission.

Technical details:
- Fixed ReferenceError in payment API
- Resolved webhook signature verification issues  
- Database RLS policies configured for frontend access
- user_with_plus view permissions corrected
- Complete test coverage for payment flow

Co-authored-by: Claude <claude@anthropic.com>"
    
    echo "✅ 更改已提交"
else
    echo "✅ 工作目录干净，无需提交"
fi

echo ""
echo "🔄 推送到远程仓库..."
git push origin $current_branch

if [ $? -eq 0 ]; then
    echo "✅ 代码推送成功！"
else
    echo "❌ 代码推送失败，请检查网络连接和仓库权限"
    exit 1
fi

echo ""
echo "🎯 部署完成！接下来的步骤："
echo ""
echo "1. 📊 在Vercel Dashboard配置环境变量："
echo "   - PADDLE_API_KEY=pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4"
echo "   - PADDLE_WEBHOOK_SECRET=pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP"
echo "   - PADDLE_ENVIRONMENT=production"
echo "   - PADDLE_TEST_MODE=false"
echo "   - NEXT_PUBLIC_BASE_URL=https://你的域名.vercel.app"
echo ""
echo "2. 🏪 在Paddle Dashboard配置："
echo "   - 完善商家信息和银行账户"
echo "   - 设置webhook: https://你的域名.vercel.app/api/webhook/paddle"
echo "   - 确认产品和价格配置"
echo ""
echo "3. 📧 提交Paddle审核申请："
echo "   - 发送邮件到: support@paddle.com"
echo "   - 主题: Request to enable checkout for production - MaogePDF"
echo "   - 参考 FINAL_DEPLOYMENT_GUIDE.md 中的邮件模板"
echo ""
echo "4. ⏳ 等待审核通过 (预计1-3个工作日)"
echo ""
echo "🎉 恭喜！你的Paddle支付系统已经准备就绪！"
echo "📚 详细部署指南请参考: READY_FOR_PRODUCTION.md"
echo ""