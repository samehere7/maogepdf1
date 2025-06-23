#!/bin/bash

# 生产环境部署脚本

echo "🚀 开始部署到生产环境..."

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "❌ 检测到未提交的更改，请先提交代码"
    exit 1
fi

# 确保在main分支
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "❌ 请在main分支上进行部署"
    exit 1
fi

# 运行测试（如果有）
echo "🧪 运行测试..."
npm run lint || { echo "❌ 代码检查失败"; exit 1; }

# 提交最新更改
echo "📝 提交最新更改..."
git add .
git commit -m "生产环境部署: 完成Paddle支付集成" || echo "没有新的更改需要提交"

# 推送到远程仓库
echo "📤 推送到远程仓库..."
git push origin main

echo "✅ 代码已推送，Vercel将自动部署"
echo ""
echo "📋 接下来的步骤："
echo "1. 访问 Vercel Dashboard 查看部署状态"
echo "2. 配置生产环境变量"
echo "3. 测试部署后的网站"
echo "4. 更新Paddle webhook URL"
echo ""
echo "🔗 环境变量配置文件: .env.local.production"