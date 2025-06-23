import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paddleConfig } from '@/config/paddle'

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json()
    
    if (!plan || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 简化版本：直接使用userId，不查询数据库（避免权限问题）
    console.log('Processing payment for:', { plan, userId })

    // 根据计划返回相应的Paddle结账链接
    const checkoutUrl = paddleConfig.checkoutUrls[plan as keyof typeof paddleConfig.checkoutUrls]
    
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    console.log(`Generated checkout URL for ${plan}:`, checkoutUrl)
    
    // 可以通过环境变量控制是否启用测试模式
    const enableTestMode = process.env.PADDLE_TEST_MODE === 'true'
    
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

    // 在URL中添加用户信息作为passthrough数据
    const urlWithUserInfo = `${checkoutUrl}?passthrough=${encodeURIComponent(JSON.stringify({ userId, plan }))}`

    return NextResponse.json({ 
      checkoutUrl: urlWithUserInfo,
      plan,
      userId
    })

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}