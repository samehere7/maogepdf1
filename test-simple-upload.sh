#!/bin/bash

# 简单的上传测试脚本
echo "🧪 Testing Upload API (without file)"

# 测试无文件的情况（应该返回适当错误）
echo "Testing POST /api/upload without file..."
curl -X POST "https://www.maogepdf.com/api/upload" \
  -H "Content-Type: multipart/form-data" \
  -w "\nStatus: %{http_code}\n"

echo -e "\n---"

# 测试基本的GET请求（应该返回405 Method Not Allowed）
echo "Testing GET /api/upload (should be 405)..."
curl -X GET "https://www.maogepdf.com/api/upload" \
  -w "\nStatus: %{http_code}\n"

echo -e "\n✅ Upload API tests completed"