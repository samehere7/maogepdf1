const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();
dotenv.config({ path: '.env.local' });

async function debugCookies() {
  try {
    console.log('🔍 测试cookie设置...');
    
    // 模拟发送session到服务端
    const testSession = {
      access_token: 'test_token_123',
      refresh_token: 'refresh_token_456',
      expires_at: Date.now() + 3600000
    };

    console.log('📤 发送测试session到 /api/auth/set-session...');
    
    const response = await fetch('http://localhost:3000/api/auth/set-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testSession)
    });

    console.log('响应状态:', response.status);
    
    if (response.ok) {
      const result = await response.text();
      console.log('响应内容:', result);
      
      // 检查返回的cookies
      const cookies = response.headers.get('set-cookie');
      console.log('设置的cookies:', cookies);
    } else {
      const error = await response.text();
      console.log('错误响应:', error);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

debugCookies();