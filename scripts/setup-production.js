#!/usr/bin/env node

/**
 * 🚀 Paddle生产环境配置脚本
 * 用于验证生产环境配置是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 检查Paddle生产环境配置...\n');

// 检查环境变量
const requiredEnvVars = [
  'PADDLE_API_KEY',
  'PADDLE_WEBHOOK_SECRET', 
  'PADDLE_ENVIRONMENT',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('📋 检查环境变量:');
let envOk = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    // 隐藏敏感信息
    const displayValue = envVar.includes('KEY') || envVar.includes('SECRET') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✅ ${envVar}: ${displayValue}`);
  } else {
    console.log(`❌ ${envVar}: 未设置`);
    envOk = false;
  }
});

// 检查Paddle配置
console.log('\n🏪 检查Paddle配置:');
const paddleTestMode = process.env.PADDLE_TEST_MODE === 'true';
const paddleEnv = process.env.PADDLE_ENVIRONMENT;

if (paddleTestMode) {
  console.log('⚠️  PADDLE_TEST_MODE: true (测试模式)');
  console.log('   → 生产环境应设置为 false');
} else {
  console.log('✅ PADDLE_TEST_MODE: false (生产模式)');
}

if (paddleEnv === 'production') {
  console.log('✅ PADDLE_ENVIRONMENT: production');
} else {
  console.log(`❌ PADDLE_ENVIRONMENT: ${paddleEnv} (应该是 production)`);
  envOk = false;
}

// 检查必要文件
console.log('\n📄 检查法律页面:');
const legalPages = [
  'app/[locale]/terms/page.tsx',
  'app/[locale]/privacy/page.tsx', 
  'app/[locale]/refund/page.tsx',
  'app/[locale]/contact/page.tsx'
];

let filesOk = true;
legalPages.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath}: 文件不存在`);
    filesOk = false;
  }
});

// 检查支付API
console.log('\n💳 检查支付API:');
const paymentApiPath = 'app/api/payment/paddle/route.ts';
const webhookApiPath = 'app/api/webhook/paddle/route.ts';

if (fs.existsSync(paymentApiPath)) {
  console.log(`✅ ${paymentApiPath}`);
} else {
  console.log(`❌ ${paymentApiPath}: 文件不存在`);
  filesOk = false;
}

if (fs.existsSync(webhookApiPath)) {
  console.log(`✅ ${webhookApiPath}`);
} else {
  console.log(`❌ ${webhookApiPath}: 文件不存在`);
  filesOk = false;
}

// 检查数据库SQL
console.log('\n🗄️  检查数据库配置:');
const sqlPath = 'supabase-setup-manual.sql';
if (fs.existsSync(sqlPath)) {
  console.log(`✅ ${sqlPath}`);
} else {
  console.log(`❌ ${sqlPath}: 文件不存在`);
  filesOk = false;
}

// 生成总结
console.log('\n📊 配置总结:');
const overallOk = envOk && filesOk;

if (overallOk) {
  console.log('✅ 生产环境配置检查通过！');
  console.log('\n🎯 下一步操作:');
  console.log('1. 推送代码到Git仓库');
  console.log('2. 在Vercel设置环境变量');
  console.log('3. 在Supabase执行SQL脚本');
  console.log('4. 提交Paddle审核申请');
  console.log('\n📧 审核邮件模板请参考: PADDLE_DEPLOYMENT_CHECKLIST.md');
} else {
  console.log('❌ 配置检查失败，请修复上述问题');
  console.log('\n🔧 修复建议:');
  if (!envOk) {
    console.log('- 在.env.local或Vercel中设置缺失的环境变量');
  }
  if (!filesOk) {
    console.log('- 确保所有必要文件已创建');
  }
  process.exit(1);
}

// 生成部署清单
if (overallOk) {
  console.log('\n📋 生成部署清单...');
  
  const checklist = `
# 🚀 Paddle部署清单 - ${new Date().toISOString().split('T')[0]}

## ✅ 已完成
- [x] 代码集成完成
- [x] 法律页面创建 (Terms, Privacy, Refund, Contact)
- [x] 支付API配置 (/api/payment/paddle)
- [x] Webhook处理 (/api/webhook/paddle)
- [x] 环境变量验证通过

## ⏳ 待完成
- [ ] 推送代码到Git: \`git push origin main\`
- [ ] Vercel环境变量配置
- [ ] Supabase SQL脚本执行
- [ ] Paddle商家信息完善
- [ ] Paddle Webhook配置
- [ ] 提交审核申请

## 🔗 重要链接
- Paddle Dashboard: https://vendors.paddle.com/
- Vercel Dashboard: https://vercel.com/dashboard  
- Supabase Dashboard: https://supabase.com/dashboard

## 📧 审核邮件
详见 PADDLE_DEPLOYMENT_CHECKLIST.md 中的邮件模板

---
Generated at: ${new Date().toISOString()}
`;

  fs.writeFileSync('DEPLOYMENT_STATUS.md', checklist.trim());
  console.log('✅ 部署清单已生成: DEPLOYMENT_STATUS.md');
}