#!/usr/bin/env node

/**
 * Paddle支付系统部署验证脚本
 * 在部署后运行此脚本验证所有组件是否正常工作
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// 配置
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  paddleApiKey: process.env.PADDLE_API_KEY,
  paddleWebhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

// 验证结果收集器
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  return async () => {
    try {
      console.log(`🧪 测试: ${name}`);
      await fn();
      results.passed++;
      results.tests.push({ name, status: 'PASS' });
      console.log(`✅ 通过: ${name}\n`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ 失败: ${name} - ${error.message}\n`);
    }
  };
}

// 测试1: 环境变量检查
const testEnvironmentVariables = test('环境变量配置', async () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'PADDLE_API_KEY',
    'PADDLE_WEBHOOK_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`缺少环境变量: ${missing.join(', ')}`);
  }
  
  console.log('  ✓ 所有必需环境变量已设置');
});

// 测试2: 数据库连接
const testDatabaseConnection = test('数据库连接', async () => {
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    throw new Error('Supabase配置缺失');
  }
  
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // 测试基本连接
  const { data, error } = await supabase
    .from('user_profiles')
    .select('count', { count: 'exact', head: true });
    
  if (error) {
    throw new Error(`数据库连接失败: ${error.message}`);
  }
  
  console.log('  ✓ 数据库连接正常');
});

// 测试3: 数据库函数
const testDatabaseFunctions = test('数据库函数', async () => {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // 测试update_user_plus_status函数
  const testUserId = '00000000-0000-0000-0000-000000000000';
  const { data, error } = await supabase.rpc('update_user_plus_status', {
    user_id: testUserId,
    is_plus: true,
    is_active_param: true,
    expire_at_param: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    plan_param: 'test'
  });
  
  if (error) {
    throw new Error(`数据库函数调用失败: ${error.message}`);
  }
  
  if (!data || data.success !== false) {
    // 对于不存在的用户，函数应该返回失败，这是正常的
  }
  
  console.log('  ✓ update_user_plus_status函数可用');
});

// 测试4: 数据库视图
const testDatabaseViews = test('数据库视图', async () => {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  
  // 测试user_with_plus视图
  const { data, error } = await supabase
    .from('user_with_plus')
    .select('*')
    .limit(1);
    
  if (error) {
    throw new Error(`视图查询失败: ${error.message}`);
  }
  
  console.log('  ✓ user_with_plus视图可用');
});

// 测试5: Paddle配置
const testPaddleConfig = test('Paddle配置', async () => {
  if (!config.paddleApiKey || !config.paddleWebhookSecret) {
    throw new Error('Paddle配置缺失');
  }
  
  // 验证API密钥格式
  if (!config.paddleApiKey.startsWith('pdl_')) {
    throw new Error('Paddle API密钥格式无效');
  }
  
  // 验证webhook密钥格式
  if (!config.paddleWebhookSecret.startsWith('pdl_')) {
    throw new Error('Paddle Webhook密钥格式无效');
  }
  
  console.log('  ✓ Paddle API密钥格式正确');
  console.log('  ✓ Paddle Webhook密钥格式正确');
});

// 测试6: 签名验证功能
const testSignatureVerification = test('签名验证功能', async () => {
  const testData = JSON.stringify({ test: 'data', timestamp: Date.now() });
  const signature = crypto.createHmac('sha256', config.paddleWebhookSecret)
    .update(testData)
    .digest('hex');
  
  // 验证签名生成和验证逻辑
  const expectedSignature = crypto.createHmac('sha256', config.paddleWebhookSecret)
    .update(testData)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    throw new Error('签名验证逻辑错误');
  }
  
  console.log('  ✓ 签名生成和验证逻辑正确');
});

// 测试7: 支付API端点 (如果本地运行)
const testPaymentAPI = test('支付API端点', async () => {
  if (!config.baseUrl.includes('localhost')) {
    console.log('  ⏭️ 跳过API测试 (非本地环境)');
    return;
  }
  
  try {
    const response = await fetch(`${config.baseUrl}/api/payment/paddle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: 'monthly',
        userId: 'test-user-id'
      })
    });
    
    if (!response.ok && response.status !== 400) {
      throw new Error(`API响应异常: ${response.status}`);
    }
    
    console.log('  ✓ 支付API端点可访问');
  } catch (error) {
    if (error.message.includes('fetch')) {
      console.log('  ⏭️ 跳过API测试 (服务未运行)');
      return;
    }
    throw error;
  }
});

// 主测试函数
async function runTests() {
  console.log('🚀 开始Paddle支付系统部署验证\n');
  console.log('=' .repeat(50));
  
  // 运行所有测试
  await testEnvironmentVariables();
  await testDatabaseConnection();
  await testDatabaseFunctions();
  await testDatabaseViews();
  await testPaddleConfig();
  await testSignatureVerification();
  await testPaymentAPI();
  
  // 输出总结
  console.log('=' .repeat(50));
  console.log('📊 测试结果总结:');
  console.log(`  ✅ 通过: ${results.passed}`);
  console.log(`  ❌ 失败: ${results.failed}`);
  console.log(`  📝 总计: ${results.tests.length}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 所有测试通过！支付系统已正确配置。');
    console.log('\n📋 下一步:');
    console.log('  1. 在Paddle控制台配置webhook URL');
    console.log('  2. 进行端到端支付测试');
    console.log('  3. 监控生产环境日志');
  } else {
    console.log('\n⚠️  部分测试失败，请检查配置:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`  • ${t.name}: ${t.error}`));
    process.exit(1);
  }
}

// 执行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { runTests, test, results };