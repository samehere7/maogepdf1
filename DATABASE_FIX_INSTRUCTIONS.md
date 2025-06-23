# 🔧 数据库权限修复指南

## 问题描述
Webhook调用时出现 `permission denied for schema public` 错误，导致Plus状态无法更新。

## 🚀 修复步骤

### 1. 打开Supabase Dashboard
访问：https://supabase.com/dashboard
- 选择你的项目
- 进入 **SQL Editor**

### 2. 执行权限修复脚本
复制 `fix-database-permissions.sql` 的**全部内容**并粘贴到SQL编辑器中。

点击 **Run** 执行脚本。

### 3. 验证修复结果
执行完成后，你应该看到：
```
✅ 数据库权限修复完成！
📋 已完成的操作:
  - 设置schema权限
  - 重新创建update_user_plus_status函数
  - 配置函数执行权限
  - 调整RLS策略
  - 创建测试函数

🧪 请运行以下命令测试:
  SELECT test_plus_update();
```

### 4. 测试函数
在SQL编辑器中运行：
```sql
SELECT test_plus_update();
```

如果看到类似以下的成功响应：
```json
{
  "test_status": "completed",
  "function_result": {
    "success": true,
    "user_id": "819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8",
    "plan": "test",
    "expire_at": "2026-06-23T15:30:00.000Z",
    "updated_at": "2025-06-23T15:30:00.000Z"
  },
  "timestamp": "2025-06-23T15:30:00.000Z"
}
```

说明修复成功！

## 🧪 验证Webhook功能

修复完成后，在你的开发环境测试：

```bash
curl -X POST http://localhost:3000/api/webhook/paddle \
  -H "Content-Type: application/json" \
  -H "X-Test-Mode: true" \
  -d '{
    "alert_name": "subscription_payment_succeeded",
    "event_time": "2025-06-23T15:30:00.000Z",
    "custom_data": {
      "userId": "819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8",
      "plan": "monthly",
      "source": "test_mode"
    }
  }'
```

应该返回：
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "userId": "819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8",
  "plan": "monthly"
}
```

## ✅ 完成标志

当你看到：
- ✅ SQL脚本执行无错误
- ✅ 测试函数返回成功结果
- ✅ Webhook测试返回成功响应
- ✅ 开发服务器日志显示 "Successfully updated plus status"

说明数据库权限问题已完全解决！

## 🚀 下一步

数据库修复完成后，你就可以：
1. **推送代码到Git仓库**
2. **配置Vercel生产环境**
3. **提交Paddle审核申请**

支付系统现在已经完全准备就绪！🎉