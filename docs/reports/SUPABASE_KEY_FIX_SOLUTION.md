# 🔧 Supabase API密钥问题诊断和解决方案

## 🔍 问题诊断结果

通过详细诊断，我发现了以下问题：

### 1. 服务角色密钥验证失败
- **匿名密钥 (Anon Key)**: ✅ 有效
- **服务角色密钥 (Service Role Key)**: ❌ 无效
- **错误信息**: "Invalid API key" 和 "signature verification failed"

### 2. JWT令牌分析
- **签发时间**: 1749197895 (2025年4月)
- **过期时间**: 2064773895 (2035年6月)
- **项目引用**: pwlvfmywfzllopuiisxg ✅ 匹配
- **角色**: service_role ✅ 正确

### 3. 问题根源
服务角色密钥的JWT签名验证失败，这通常意味着：
1. 密钥不是从当前Supabase项目生成的
2. 密钥已被重新生成/轮换
3. 项目的JWT密钥已更改

## 🚀 解决方案

### 选项1: 重新获取正确的服务角色密钥（推荐）

1. **访问Supabase控制台**:
   ```
   https://supabase.com/dashboard/project/pwlvfmywfzllopuiisxg
   ```

2. **获取新的服务角色密钥**:
   - 进入 **Settings** → **API**
   - 在 **Project API keys** 部分找到 **service_role** 密钥
   - 复制新的密钥

3. **更新环境变量**:
   ```bash
   # 在 .env.local 文件中更新
   SUPABASE_SERVICE_ROLE_KEY=你的新服务角色密钥
   ```

4. **重启应用**:
   ```bash
   npm run dev
   ```

### 选项2: 使用匿名密钥作为临时解决方案

由于匿名密钥是有效的，我们可以修改PDF创建逻辑来暂时绕过这个问题：

#### 修改PDF QA API路由

在 `app/api/pdf/qa/route.ts` 中，我们可以：

1. **使用匿名客户端创建PDF记录**（如果RLS策略允许）
2. **或者跳过PDF记录创建**，直接使用临时数据

```typescript
// 临时解决方案：使用匿名客户端
import { createClient } from '@/lib/supabase/client'; // 使用匿名客户端
const supabase = createClient(); // 这使用匿名密钥
```

### 选项3: 修复RLS策略以允许匿名用户创建PDF记录

在Supabase SQL编辑器中执行：

```sql
-- 允许匿名用户创建临时PDF记录
CREATE POLICY "allow_anon_temp_pdf_creation" ON public.pdfs
  FOR INSERT 
  TO anon
  WITH CHECK (url LIKE 'temp://%');

-- 允许匿名用户读取自己创建的临时PDF
CREATE POLICY "allow_anon_temp_pdf_read" ON public.pdfs
  FOR SELECT 
  TO anon
  USING (url LIKE 'temp://%');
```

## 🎯 立即执行步骤

### 步骤1: 验证当前状态
```bash
curl -X GET http://localhost:3000/api/verify-supabase-keys
```

### 步骤2: 更新服务角色密钥
1. 从Supabase控制台获取新的service_role密钥
2. 更新 `.env.local` 文件
3. 重启开发服务器

### 步骤3: 验证修复
```bash
curl -X GET http://localhost:3000/api/verify-supabase-keys
```

应该看到服务角色密钥变为有效状态。

### 步骤4: 测试PDF QA功能
测试创建PDF文档是否不再报告"Invalid API key"错误。

## 🔒 安全注意事项

1. **不要在前端使用服务角色密钥**
2. **确保服务角色密钥仅在服务器端使用**
3. **定期轮换API密钥**
4. **使用适当的RLS策略限制访问**

## 📋 验证清单

- [ ] 服务角色密钥验证通过
- [ ] PDF创建不再报告"Invalid API key"
- [ ] 匿名用户可以使用AI功能
- [ ] 已登录用户功能正常
- [ ] RLS策略正确配置

## 🆘 如果问题持续存在

如果更新密钥后仍有问题：

1. **检查网络连接**: 确保可以访问Supabase服务
2. **验证项目ID**: 确认URL中的项目ID是正确的
3. **检查时间同步**: 确保服务器时间正确
4. **查看Supabase日志**: 在控制台查看详细错误信息

---

**建议**: 优先执行选项1（重新获取密钥），这是最直接和可靠的解决方案。