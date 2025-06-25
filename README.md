# Maoge PDF - AI-Powered PDF Analysis Platform

一个基于Next.js和AI的智能PDF分析平台，支持闪卡学习、文档对话等功能，并集成了Supabase数据库和Puppeteer网页自动化工具。

## 🚀 功能特性

- 📄 **PDF上传与解析** - 支持大文件上传和文本提取
- 🤖 **AI智能对话** - 基于OpenRouter API的文档问答
- 🎯 **闪卡学习系统** - 自动生成学习卡片，支持难度标记
- 👤 **用户认证** - 集成Google OAuth登录
- 📱 **响应式设计** - 适配移动端和桌面端
- ☁️ **云存储支持** - 集成Supabase数据库和存储
- 🌐 **网页抓取** - 使用Puppeteer进行网页自动化

## 📦 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, Radix UI
- **认证**: NextAuth.js with Google OAuth
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: OpenRouter API
- **网页抓取**: Puppeteer
- **部署**: Vercel

## 🛠️ 本地开发

### 1. 克隆项目
```bash
git clone https://github.com/samehere7/maogepdf1.git
cd maogepdf1
```

### 2. 安装依赖
```bash
npm install --legacy-peer-deps
```

### 3. 环境变量配置
创建 `.env.local` 文件并填入相应的值：
```
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter配置
OPENROUTER_API_KEY=your-openrouter-api-key

# 其他环境变量...
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Puppeteer配置
PUPPETEER_SKIP_DOWNLOAD=true
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 🌐 Vercel自动部署

### 环境变量配置
在Vercel项目设置中配置以下环境变量：

- `OPENROUTER_API_KEY` - OpenRouter API密钥
- `GOOGLE_CLIENT_ID` - Google OAuth客户端ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth客户端密钥
- `NEXTAUTH_URL` - 生产环境URL
- `NEXTAUTH_SECRET` - NextAuth密钥
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase项目URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase服务角色密钥

### 自动部署触发
每次推送到 `main` 分支将自动触发Vercel部署。

## 📝 更新日志

### 最新更新 (2025-06-16)
- ✅ 集成Supabase数据库用于存储用户数据和文档
- ✅ 添加Puppeteer支持，用于网页抓取和自动化
- ✅ 修复闪卡学习进度条更新问题
- ✅ 优化聊天界面文本排版和格式化显示
- ✅ 添加聊天等待状态的转动加载指示器
- ✅ 完善闪卡编辑和管理功能
- ✅ 清理代码库安全性问题

## 示例脚本

项目包含两个示例脚本，展示如何使用Supabase和Puppeteer：

### Supabase示例

```bash
npx ts-node scripts/supabase-example.ts
```

这个脚本演示了：
- 连接Supabase
- 基础CRUD操作（创建、读取、更新、删除）
- 高级查询

### Puppeteer示例

```bash
npx ts-node scripts/puppeteer-example.ts
```

这个脚本演示了：
- 启动浏览器
- 网页导航
- 截图
- 内容提取

## 注意事项

- 确保`.env.local`文件不被提交到版本控制系统（已在`.gitignore`中配置）
- 如遇到Puppeteer安装问题，可参考[Puppeteer文档](https://pptr.dev/troubleshooting)
- Supabase客户端初始化位于`lib/supabase/client.ts`

## 推送仓库

使用项目根目录的`push-local.sh`脚本进行强制推送（以本地代码为准）：

```bash
./push-local.sh
```

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## �� 许可证

MIT License
# Deploy trigger 2025年 6月25日 星期三 14时39分00秒 CST
# Force redeploy 2025年 6月25日 星期三 16时02分51秒 CST
# Updated Supabase keys 2025年 6月25日 星期三 16时17分01秒 CST
# Force deploy for new keys 2025年 6月25日 星期三 16时25分28秒 CST
# CRITICAL: Force deploy new ANON key 2025年 6月25日 星期三 16时38分26秒 CST
