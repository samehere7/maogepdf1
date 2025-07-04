# 部署配置说明

## Vercel环境变量配置

为了确保Plus用户GPT-4o功能正常工作，需要在Vercel项目设置中配置以下环境变量：

### 必需的环境变量

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://pwlvfmywfzllopuiisxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouter API密钥 - 基础配置
OPENROUTER_API_KEY=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

# OpenRouter API密钥 - 分级配置
OPENROUTER_API_KEY_FREE=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
OPENROUTER_API_KEY_FAST=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

# 🔑 Plus用户专用 - GPT-4o配置（重要！）
OPENROUTER_API_KEY_HIGH=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

# 其他配置
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
PUPPETEER_SKIP_DOWNLOAD=true

# Paddle支付配置
PADDLE_API_KEY=pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4
PADDLE_WEBHOOK_SECRET=pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP
PADDLE_ENVIRONMENT=production
PADDLE_TEST_MODE=true
```

## 配置步骤

1. **登录Vercel仪表板**
2. **选择项目** → 点击项目名称
3. **进入设置** → Settings → Environment Variables
4. **添加环境变量**：
   - 点击 "Add New" 按钮
   - 输入变量名和值
   - 选择环境：Production, Preview, Development（建议全选）
   - 点击 "Save"

## 重要提醒

### Plus用户功能依赖
- `OPENROUTER_API_KEY_HIGH` 是Plus用户GPT-4o功能的关键配置
- 如果此变量缺失，Plus用户会自动回退到DeepSeek模型
- 确保此API密钥有足够的额度和权限

### 模型配置说明
- **Plus用户大PDF**：使用 `openai/gpt-4o` (需要 OPENROUTER_API_KEY_HIGH)
- **Plus用户高质量**：使用 `openai/gpt-4o-mini` (需要 OPENROUTER_API_KEY_HIGH)
- **免费用户**：使用 `deepseek/deepseek-chat-v3-0324:free`

## 故障排除

### 检查配置状态
访问以下API端点检查配置：
```
https://your-domain.vercel.app/api/config-check
```

### 常见问题
1. **"系统配置问题"错误** → 检查 OPENROUTER_API_KEY_HIGH 是否设置
2. **API密钥验证失败** → 检查API密钥格式和有效性
3. **Plus用户功能不可用** → 确认环境变量在Production环境已设置

### 重新部署
环境变量更改后，需要触发重新部署：
1. 在Vercel项目页面点击 "Redeploy" 按钮
2. 或者推送新的代码提交到主分支

## 部署验证

部署完成后，验证以下功能：
- [ ] 普通用户能正常使用DeepSeek模型
- [ ] Plus用户能使用GPT-4o处理大PDF
- [ ] Plus用户高质量模式正常工作
- [ ] 配置检查API返回正确状态