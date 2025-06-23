import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paddleConfig } from '@/config/paddle'
import { Paddle, Environment } from '@paddle/paddle-node-sdk'

export async function POST(req: NextRequest) {
  let plan: string | undefined
  let userId: string | undefined
  
  try {
    const body = await req.json()
    plan = body.plan
    userId = body.userId
    
    if (!plan || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 可以通过环境变量控制是否启用测试模式
    const enableTestMode = process.env.PADDLE_TEST_MODE === 'true'
    
    const requestId = Math.random().toString(36).substring(7)
    console.log('=== Processing Payment ===', {
      requestId,
      plan,
      userId,
      timestamp: new Date().toISOString(),
      enableTestMode
    })

    // 验证计划是否有效
    const priceId = paddleConfig.priceIds[plan as keyof typeof paddleConfig.priceIds]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    if (enableTestMode) {
      // 测试模式：返回模拟成功响应
      console.log('Test mode enabled: simulating successful payment')
      return NextResponse.json({
        success: true,
        message: 'Test mode - payment simulated',
        plan,
        userId,
        mockPayment: true
      })
    }

    // 初始化Paddle SDK
    console.log('Initializing Paddle SDK...', {
      hasApiKey: !!paddleConfig.apiKey,
      environment: paddleConfig.environment,
      apiKeyPrefix: paddleConfig.apiKey?.substring(0, 20) + '...'
    })
    
    const paddle = new Paddle(paddleConfig.apiKey!, {
      environment: paddleConfig.environment === 'production' ? Environment.production : Environment.sandbox
    })

    // 创建transaction with customData
    const transaction = await paddle.transactions.create({
      items: [{
        priceId: priceId,
        quantity: 1
      }],
      customData: {
        userId: userId,
        plan: plan,
        source: 'web_app'
      },
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      discountId: undefined
    })

    console.log('Created transaction:', transaction.id)
    console.log('Checkout URL:', transaction.checkoutUrl)

    return NextResponse.json({ 
      checkoutUrl: transaction.checkoutUrl,
      transactionId: transaction.id,
      plan,
      userId
    })

  } catch (error) {
    const requestId = Math.random().toString(36).substring(7)
    const timestamp = new Date().toISOString()
    
    console.error('=== Payment API Error ===', {
      requestId,
      timestamp,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      plan,
      userId,
      paddleConfig: {
        hasApiKey: !!paddleConfig.apiKey,
        environment: paddleConfig.environment,
        priceIds: paddleConfig.priceIds
      }
    })
    
    let errorMessage = 'Internal server error'
    let statusCode = 500
    let errorCode = 'INTERNAL_ERROR'
    
    if (error instanceof Error) {
      if (error.message.includes('Missing required Paddle') || error.message.includes('API key')) {
        errorMessage = 'Payment service configuration error'
        errorCode = 'CONFIG_ERROR'
        statusCode = 503
      } else if (error.message.includes('Invalid') || error.message.includes('price')) {
        errorMessage = 'Invalid request parameters'
        errorCode = 'INVALID_PARAMS'
        statusCode = 400
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Payment service temporarily unavailable'
        errorCode = 'SERVICE_UNAVAILABLE'
        statusCode = 503
      } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        errorMessage = 'Payment service authentication failed'
        errorCode = 'AUTH_ERROR'
        statusCode = 401
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Too many requests, please try again later'
        errorCode = 'RATE_LIMIT'
        statusCode = 429
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      errorCode,
      timestamp,
      requestId,
      retryable: statusCode >= 500 || statusCode === 429
    }, { status: statusCode })
  }
}