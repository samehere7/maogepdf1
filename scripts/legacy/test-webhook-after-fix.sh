#!/bin/bash

echo "🧪 测试Webhook修复效果..."
echo ""

echo "📡 发送测试webhook请求..."
response=$(curl -s -X POST http://localhost:3000/api/webhook/paddle \
  -H "Content-Type: application/json" \
  -H "X-Test-Mode: true" \
  -d '{
    "alert_name": "subscription_payment_succeeded",
    "event_time": "2025-06-23T15:45:00.000Z",
    "custom_data": {
      "userId": "819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8",
      "plan": "yearly",
      "source": "test_mode"
    }
  }')

echo "📥 响应结果:"
echo "$response" | jq . 2>/dev/null || echo "$response"
echo ""

# 检查响应是否包含成功信息
if echo "$response" | grep -q '"success":true'; then
  echo "✅ Webhook测试成功！"
  echo "🎉 数据库权限修复完成！Plus状态更新正常！"
else
  echo "❌ Webhook测试失败，请检查数据库修复是否正确执行"
fi

echo ""
echo "🔍 请检查开发服务器日志确认数据库更新状态"