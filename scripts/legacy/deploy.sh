#!/bin/bash

# 🚀 MaogePDF 自动化部署脚本
# 版本: 1.0.0
# 作者: Claude Code Assistant

echo "🚀 开始 MaogePDF 部署流程..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $1 已安装${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 未安装${NC}"
        return 1
    fi
}

# 步骤1: 环境检查
echo -e "\n${BLUE}📋 步骤1: 环境检查${NC}"
check_command "node" || { echo "请安装 Node.js"; exit 1; }
check_command "npm" || { echo "请安装 npm"; exit 1; }
check_command "git" || { echo "请安装 Git"; exit 1; }

# 检查Node版本
NODE_VERSION=$(node --version | cut -d 'v' -f 2)
echo "Node.js 版本: $NODE_VERSION"

# 步骤2: 依赖安装
echo -e "\n${BLUE}📦 步骤2: 安装依赖${NC}"
npm install --legacy-peer-deps
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 依赖安装成功${NC}"
else
    echo -e "${RED}❌ 依赖安装失败${NC}"
    exit 1
fi

# 步骤3: 生成Prisma Client
echo -e "\n${BLUE}🗄️ 步骤3: 生成 Prisma Client${NC}"
npx prisma generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client 生成成功${NC}"
else
    echo -e "${RED}❌ Prisma Client 生成失败${NC}"
    exit 1
fi

# 步骤4: 构建项目
echo -e "\n${BLUE}🔨 步骤4: 构建项目${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 项目构建成功${NC}"
else
    echo -e "${RED}❌ 项目构建失败${NC}"
    exit 1
fi

# 步骤5: 检查环境变量
echo -e "\n${BLUE}🔑 步骤5: 检查环境变量${NC}"
source .env.local 2>/dev/null || echo "⚠️ .env.local 文件不存在"

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "DATABASE_URL"
    "OPENROUTER_API_KEY"
    "PADDLE_API_KEY"
)

all_vars_present=true
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ 环境变量 $var 未设置${NC}"
        all_vars_present=false
    else
        echo -e "${GREEN}✅ $var 已设置${NC}"
    fi
done

if [ "$all_vars_present" = false ]; then
    echo -e "${YELLOW}⚠️ 请在部署平台设置所有必需的环境变量${NC}"
fi

# 步骤6: 检查Git状态
echo -e "\n${BLUE}📝 步骤6: 检查 Git 状态${NC}"
if [ -d ".git" ]; then
    echo "当前分支: $(git branch --show-current)"
    echo "最新提交: $(git log -1 --oneline)"
    
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️ 有未提交的更改${NC}"
        read -p "是否要提交这些更改? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "部署前提交: $(date '+%Y-%m-%d %H:%M:%S')"
            git push origin main
        fi
    else
        echo -e "${GREEN}✅ Git 状态干净${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ 不是 Git 仓库${NC}"
fi

# 步骤7: 部署到Vercel
echo -e "\n${BLUE}🚀 步骤7: 部署到 Vercel${NC}"

# 检查是否安装了Vercel CLI
if ! check_command "vercel"; then
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
fi

# 检查是否已登录
if ! vercel whoami >/dev/null 2>&1; then
    echo "请先登录 Vercel:"
    vercel login
fi

# 部署
echo "开始部署到 Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 部署成功!${NC}"
    echo -e "${GREEN}✅ 应用已成功部署到生产环境${NC}"
    
    # 获取部署URL
    DEPLOY_URL=$(vercel ls | grep "maoge-pdf" | head -1 | awk '{print $2}')
    if [ -n "$DEPLOY_URL" ]; then
        echo -e "${BLUE}🌐 部署地址: https://$DEPLOY_URL${NC}"
    fi
    
    echo -e "\n${YELLOW}📋 部署后检查清单:${NC}"
    echo "1. ✅ 访问应用URL确认页面正常加载"
    echo "2. ✅ 测试用户注册/登录功能"
    echo "3. ✅ 测试PDF上传功能"
    echo "4. ✅ 测试AI聊天功能"
    echo "5. ✅ 测试多语言切换"
    echo "6. ✅ 测试支付功能"
    
else
    echo -e "\n${RED}❌ 部署失败${NC}"
    echo "请检查错误信息并重试"
    exit 1
fi

echo -e "\n${GREEN}🏁 部署流程完成!${NC}"