# Supabase 存储上传修复指南

## 问题描述

上传 PDF 文件时出现以下错误：

1. `new row violates row-level security policy` - Supabase 存储桶的 RLS 策略配置不正确
2. `Foreign key constraint violated on the constraint: PDF_userId_fkey` - 数据库外键约束错误
3. `The column `User.plus` does not exist in the current database` - 数据库模型与代码不一致

## 解决方案

### 1. 确保环境变量正确设置

在 `.env.local` 文件中，确保有以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. 设置存储桶 RLS 策略

有两种方式设置 RLS 策略：

#### 方式一：使用 Supabase 控制台

1. 登录 Supabase 控制台
2. 进入 SQL 编辑器
3. 复制 `simple-storage-policy.sql` 文件内容并执行
4. 检查存储桶设置，确保 `pdfs` 桶已创建且设置为公开

#### 方式二：使用脚本自动应用

```bash
# 安装依赖
npm install dotenv

# 执行脚本
node scripts/apply-storage-policy.js
```

### 3. 修复用户记录和外键约束问题

用户表和 PDF 表之间的外键约束需要确保 PDF 记录引用的用户 ID 存在于用户表中。

#### 使用修复脚本

```bash
# 安装依赖
npm install dotenv @prisma/client

# 执行脚本
node scripts/fix-users.js
```

这个脚本会：
1. 同步 Supabase Auth 用户和数据库用户表
2. 修复 PDF 记录中的 userId 字段（从邮箱格式改为 UUID 格式）

### 4. 修复 User 表结构和 user_with_plus 视图

需要添加 `plus`、`is_active` 和 `expire_at` 字段到 User 表，并创建 `user_with_plus` 视图。

#### 使用修复脚本

```bash
# 安装依赖
npm install dotenv @prisma/client

# 执行脚本
node scripts/fix-user-plus.js
```

这个脚本会：
1. 添加 `plus`、`is_active` 和 `expire_at` 字段到 User 表
2. 创建 `user_with_plus` 视图
3. 生成更新后的 Prisma 客户端

### 5. 代码修改

我们已经对以下文件进行了修改：

1. `lib/supabase/admin.ts` - 创建了管理员客户端
2. `lib/pdf-service.ts` - 使用管理员客户端上传文件，并确保用户记录存在
3. `app/api/upload/route.ts` - 优化了上传流程，使用正确的用户 ID，添加了对 `user_with_plus` 视图不可用的处理
4. `components/SidebarUserInfo.tsx` - 添加了对 `user_with_plus` 视图不可用的处理
5. `components/AccountModal.tsx` - 添加了对 `user_with_plus` 视图不可用的处理
6. `prisma/schema.prisma` - 更新了 User 模型，添加了 `plus`、`is_active` 和 `expire_at` 字段

主要改进：
- 使用 Supabase 用户 ID 而不是邮箱作为用户标识
- 上传前检查用户是否存在，不存在则创建
- 使用管理员客户端绕过 RLS 限制
- 添加了对 `user_with_plus` 视图不可用的容错处理

### 6. 验证修复

上传一个 PDF 文件，检查控制台日志，确认：

1. 文件成功上传到 Supabase 存储
2. 数据库中创建了 PDF 记录
3. 前端可以正常显示和访问 PDF

## 故障排除

如果仍然遇到问题：

1. 检查控制台日志，查看详细错误信息
2. 确认 `pdfs` 存储桶已创建且为公开
3. 验证 RLS 策略是否正确应用
4. 确认 `SUPABASE_SERVICE_ROLE_KEY` 有效且具有足够权限
5. 检查数据库中的用户记录是否与 Supabase Auth 中的用户匹配
6. 验证 User 表是否包含 `plus`、`is_active` 和 `expire_at` 字段
7. 检查 `user_with_plus` 视图是否存在并可访问

## 参考资料

- [Supabase 存储文档](https://supabase.com/docs/guides/storage)
- [Supabase RLS 策略文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Prisma 外键约束文档](https://www.prisma.io/docs/concepts/components/prisma-schema/relations) 