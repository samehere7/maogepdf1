import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    requestInfo: {},
    envCheck: {},
    importTests: {},
    error: null
  }

  try {
    // 1. 基本请求信息
    const body = await req.json()
    debugInfo.requestInfo = {
      plan: body.plan,
      userId: body.userId,
      hasRequiredParams: !!(body.plan && body.userId)
    }

    // 2. 环境变量检查
    debugInfo.envCheck = {
      PADDLE_API_KEY: !!process.env.PADDLE_API_KEY,
      PADDLE_WEBHOOK_SECRET: !!process.env.PADDLE_WEBHOOK_SECRET,
      PADDLE_ENVIRONMENT: process.env.PADDLE_ENVIRONMENT || 'not set',
      PADDLE_TEST_MODE: process.env.PADDLE_TEST_MODE || 'not set',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'not set'
    }

    // 3. 测试导入
    try {
      const { paddleConfig } = await import('@/config/paddle')
      debugInfo.importTests.paddleConfig = {
        success: true,
        hasApiKey: !!paddleConfig.apiKey,
        environment: paddleConfig.environment,
        testMode: paddleConfig.testMode,
        priceIds: paddleConfig.priceIds
      }
    } catch (configError) {
      debugInfo.importTests.paddleConfig = {
        success: false,
        error: configError instanceof Error ? configError.message : 'Unknown error'
      }
    }

    try {
      const { Paddle, Environment } = await import('@paddle/paddle-node-sdk')
      debugInfo.importTests.paddleSDK = {
        success: true,
        paddleType: typeof Paddle,
        environmentType: typeof Environment
      }
    } catch (sdkError) {
      debugInfo.importTests.paddleSDK = {
        success: false,
        error: sdkError instanceof Error ? sdkError.message : 'Unknown error'
      }
    }

    // 4. 如果启用测试模式，模拟成功
    if (process.env.PADDLE_TEST_MODE === 'true') {
      return NextResponse.json({
        ...debugInfo,
        result: {
          success: true,
          testMode: true,
          mockPayment: true,
          message: 'Test mode - payment simulated'
        }
      })
    }

    // 5. 尝试初始化Paddle（但不调用API）
    try {
      const { paddleConfig } = await import('@/config/paddle')
      const { Paddle, Environment } = await import('@paddle/paddle-node-sdk')
      
      const paddle = new Paddle(paddleConfig.apiKey!, {
        environment: paddleConfig.environment === 'production' ? Environment.production : Environment.sandbox
      })

      debugInfo.importTests.paddleInit = {
        success: true,
        paddleInitialized: true
      }

    } catch (initError) {
      debugInfo.importTests.paddleInit = {
        success: false,
        error: initError instanceof Error ? initError.message : 'Unknown init error'
      }
    }

    return NextResponse.json({
      ...debugInfo,
      result: {
        success: true,
        message: 'Debug info collected successfully - no actual payment attempted'
      }
    })

  } catch (error) {
    debugInfo.error = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }

    return NextResponse.json(debugInfo, { status: 500 })
  }
}