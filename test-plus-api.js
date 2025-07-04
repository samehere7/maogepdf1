/**
 * 测试Plus用户GPT-4o API调用
 */
require('dotenv').config({ path: '.env.local' });

async function testPlusUserAPI() {
  console.log('🔧 测试Plus用户GPT-4o API配置...\n');
  
  // 检查环境变量
  const apiKey = process.env.OPENROUTER_API_KEY_HIGH;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  console.log('环境变量检查:');
  console.log(`✓ OPENROUTER_API_KEY_HIGH: ${apiKey ? `${apiKey.substring(0, 20)}...` : '❌ 未设置'}`);
  console.log(`✓ BASE_URL: ${baseUrl}`);
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY_HIGH 环境变量未设置');
    return false;
  }
  
  // 测试Plus用户大PDF配置
  const plusLargePdfConfig = {
    provider: "openrouter",
    model: "openai/gpt-4o",
    apiKey: apiKey,
    maxTokens: 4000,
    contextWindow: 128000
  };
  
  // 测试Plus用户高质量配置
  const plusHighQualityConfig = {
    provider: "openrouter", 
    model: "openai/gpt-4o-mini",
    apiKey: apiKey,
    maxTokens: 2000,
    contextWindow: 128000
  };
  
  console.log('\n📋 模型配置:');
  console.log('Plus大PDF配置:', {
    model: plusLargePdfConfig.model,
    provider: plusLargePdfConfig.provider,
    maxTokens: plusLargePdfConfig.maxTokens,
    contextWindow: plusLargePdfConfig.contextWindow
  });
  
  console.log('Plus高质量配置:', {
    model: plusHighQualityConfig.model,
    provider: plusHighQualityConfig.provider,
    maxTokens: plusHighQualityConfig.maxTokens,
    contextWindow: plusHighQualityConfig.contextWindow
  });
  
  // 测试API调用
  console.log('\n🚀 测试API调用...');
  
  try {
    // 测试GPT-4o-mini (较便宜，用于测试)
    const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': baseUrl,
        'X-Title': 'Maoge PDF Plus Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: '请简单回答：你是什么模型？'
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error(`❌ API调用失败: ${testResponse.status}`);
      console.error('错误详情:', errorText);
      return false;
    }
    
    const data = await testResponse.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    console.log('✅ API调用成功!');
    console.log('模型回答:', aiResponse);
    console.log('使用的模型:', data.model);
    console.log('消耗tokens:', data.usage);
    
    return true;
    
  } catch (error) {
    console.error('❌ API调用异常:', error.message);
    return false;
  }
}

// 运行测试
testPlusUserAPI().then(success => {
  if (success) {
    console.log('\n🎉 Plus用户GPT-4o配置测试通过!');
    console.log('✅ 可以安全推送到仓库');
  } else {
    console.log('\n⚠️ 配置测试失败，请检查设置');
  }
}).catch(error => {
  console.error('测试运行失败:', error);
});