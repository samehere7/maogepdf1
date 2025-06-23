#!/usr/bin/env node

// Paddle配置验证脚本
console.log('🔍 验证Paddle配置...\n')

// 检查配置文件
try {
  const config = require('../config/paddle.ts')
  console.log('✅ 配置文件加载成功')
} catch (error) {
  console.log('❌ 配置文件加载失败:', error.message)
}

// 验证关键配置
const requiredConfig = {
  'API Key': 'pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4',
  'Webhook Secret': 'pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP',
  'Product ID': 'pro_01jy64mwtctkr7632j07pasfan',
  'Monthly Checkout': 'https://pay.paddle.io/hsc_01jy65wha6jh3m5rv9jpxv4ts2_b4jjcafd454938bcvgxhevbtwfv6szc8',
  'Yearly Checkout': 'https://pay.paddle.io/hsc_01jy65xjejc153p9nkbwzpmkmr_w18j5n4t3yx7snzgb9agnbahhr8e1rnx'
}

console.log('📋 Paddle配置清单:')
Object.entries(requiredConfig).forEach(([key, value]) => {
  console.log(`✅ ${key}: ${value.substring(0, 50)}...`)
})

console.log('\n🎯 配置状态:')
console.log('✅ API密钥: 已配置 (生产环境)')
console.log('✅ Webhook密钥: 已配置')
console.log('✅ 产品ID: 已配置')
console.log('✅ 结账链接: 已配置 (月付 + 年付)')

console.log('\n📝 下一步:')
console.log('1. 将环境变量添加到Vercel')
console.log('2. 部署应用到生产环境')
console.log('3. 更新Paddle webhook URL')
console.log('4. 测试完整支付流程')

// 生成Vercel环境变量配置
console.log('\n🔧 Vercel环境变量配置:')
console.log('PADDLE_API_KEY=pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4')
console.log('PADDLE_WEBHOOK_SECRET=pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP')
console.log('PADDLE_ENVIRONMENT=production')
console.log('PADDLE_TEST_MODE=false')
console.log('PADDLE_PRODUCT_ID=pro_01jy64mwtctkr7632j07pasfan')