# Maoge PDF - AI-Powered PDF Analysis Platform

一个基于Next.js和AI的智能PDF分析平台，支持闪卡学习、文档对话等功能。

## 🚀 功能特性

- 📄 **PDF上传与解析** - 支持大文件上传和文本提取
- 🤖 **AI智能对话** - 基于OpenRouter API的文档问答
- 🎯 **闪卡学习系统** - 自动生成学习卡片，支持难度标记
- 👤 **用户认证** - 集成Google OAuth登录
- 📱 **响应式设计** - 适配移动端和桌面端
- ☁️ **云存储支持** - 集成Supabase数据库和存储

## 📦 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, Radix UI
- **认证**: NextAuth.js with Google OAuth
- **数据库**: Supabase (PostgreSQL)
- **AI服务**: OpenRouter API
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
复制 `.env.example` 到 `.env.local` 并填入相应的值：
```bash
cp .env.example .env.local
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

### 最新更新 (2025-06-11)
- ✅ 修复闪卡学习进度条更新问题
- ✅ 禁用自动总结功能，避免干扰用户聊天
- ✅ 优化聊天界面文本排版和格式化显示
- ✅ 添加聊天等待状态的转动加载指示器
- ✅ 完善闪卡编辑和管理功能
- ✅ 清理代码库安全性问题

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📄 许可证

MIT License
