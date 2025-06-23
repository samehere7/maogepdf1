// Paddle配置文件 - 生产环境配置
export const paddleConfig = {
  // 生产环境结账链接
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
  
  // API配置
  apiKey: process.env.PADDLE_API_KEY || 'pdl_live_apikey_01jydzcrb3a3vq5nf07d4ewtem_b4wmr7rFJd9JbwxVaHmaJQ_AV4',
  webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || 'pdl_ntfset_01jydz6s6h8rjsh41fe514n1cx_DVGUHwqX9KMi055o49BN8IIt7027tIJP',
  
  // 环境配置
  environment: process.env.PADDLE_ENVIRONMENT || 'production',
  testMode: process.env.PADDLE_TEST_MODE === 'true'
}