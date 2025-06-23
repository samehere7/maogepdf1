// Paddle配置文件 - 生产环境配置

// 验证必需的环境变量
function validateEnvironment() {
  const required = ['PADDLE_API_KEY', 'PADDLE_WEBHOOK_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Paddle environment variables: ${missing.join(', ')}`);
  }
}

// 在非测试环境中验证配置
if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV === 'production') {
  validateEnvironment();
}

export const paddleConfig = {
  // 价格ID配置 - 用于API创建transaction
  priceIds: {
    monthly: 'pri_01jy6547gd84apzec3g66ysbb5',
    yearly: 'pri_01jy654mn4mr07eqd3x59ya42p'
  },
  
  // 生产环境结账链接（备用）
  checkoutUrls: {
    monthly: 'https://pay.paddle.io/hsc_01jy65wha6jh3m5rv9jpxv4ts2_b4jjcafd454938bcvgxhevbtwfv6szc8',
    yearly: 'https://pay.paddle.io/hsc_01jy65xjejc153p9nkbwzpmkmr_w18j5n4t3yx7snzgb9agnbahhr8e1rnx'
  },
  
  // 产品信息
  products: {
    plus: {
      id: 'pro_01jy64mwtctkr7632j07pasfan',
      name: 'Plus Membership',
      prices: {
        monthly: 11.99,
        yearly: 86.40
      }
    }
  },
  
  // API配置 - 必须通过环境变量提供
  apiKey: process.env.PADDLE_API_KEY,
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET,
  
  // 环境配置
  environment: process.env.PADDLE_ENVIRONMENT || 'production',
  testMode: process.env.PADDLE_TEST_MODE === 'true'
}