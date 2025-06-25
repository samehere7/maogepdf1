import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV
    },
    paddleConfig: {
      PADDLE_API_KEY: process.env.PADDLE_API_KEY ? {
        present: true,
        length: process.env.PADDLE_API_KEY.length,
        prefix: process.env.PADDLE_API_KEY.substring(0, 12) + '...',
        suffix: '...' + process.env.PADDLE_API_KEY.substring(process.env.PADDLE_API_KEY.length - 4)
      } : { present: false },
      PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET ? {
        present: true,
        length: process.env.PADDLE_WEBHOOK_SECRET.length,
        prefix: process.env.PADDLE_WEBHOOK_SECRET.substring(0, 8) + '...'
      } : { present: false },
      PADDLE_ENVIRONMENT: process.env.PADDLE_ENVIRONMENT || 'not set',
      PADDLE_TEST_MODE: process.env.PADDLE_TEST_MODE || 'not set'
    },
    import_test: null,
    config_test: null
  }

  // 测试Paddle配置导入
  try {
    const { paddleConfig } = await import('@/config/paddle')
    envCheck.config_test = {
      success: true,
      apiKey: paddleConfig.apiKey ? {
        present: true,
        matches_env: paddleConfig.apiKey === process.env.PADDLE_API_KEY
      } : { present: false },
      environment: paddleConfig.environment,
      testMode: paddleConfig.testMode,
      priceIds: paddleConfig.priceIds
    }
  } catch (configError) {
    envCheck.config_test = {
      success: false,
      error: configError instanceof Error ? configError.message : 'Unknown error'
    }
  }

  // 测试Paddle SDK导入
  try {
    const { Paddle, Environment } = await import('@paddle/paddle-node-sdk')
    envCheck.import_test = {
      success: true,
      paddle_available: typeof Paddle === 'function',
      environment_available: typeof Environment === 'object'
    }
  } catch (importError) {
    envCheck.import_test = {
      success: false,
      error: importError instanceof Error ? importError.message : 'Unknown error'
    }
  }

  return NextResponse.json(envCheck)
}