import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥进行webhook操作
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PaddleWebhookPayload {
  alert_name: string
  event_time: string
  passthrough?: string
  custom_data?: {
    userId?: string
    plan?: string
    source?: string
    [key: string]: any
  }
  user_id?: string
  subscription_id?: string
  subscription_plan_id?: string
  status?: string
  user_email?: string
  next_bill_date?: string
  update_url?: string
  cancel_url?: string
  checkout_id?: string
  order_id?: string
}

export async function POST(req: NextRequest) {
  try {
    // 获取原始请求体用于签名验证
    const body = await req.text()
    const signature = req.headers.get('paddle-signature')
    
    // 验证Paddle webhook签名（生产环境必须）
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('PADDLE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // 在生产环境或有签名的情况下进行验证 (测试模式下跳过)
    if ((process.env.PADDLE_ENVIRONMENT === 'production' && process.env.PADDLE_TEST_MODE !== 'true') || signature) {
      if (!signature) {
        console.error('Missing Paddle webhook signature')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
      
      if (!verifyPaddleSignature(body, signature, webhookSecret)) {
        console.error('Invalid Paddle webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
      
      console.log('✅ Paddle webhook signature verified successfully')
    } else {
      console.log('⚠️ Webhook signature verification skipped (development mode)')
    }
    
    const payload: PaddleWebhookPayload = JSON.parse(body)
    
    console.log('=== Paddle Webhook Received ===')
    console.log('Event Type:', payload.alert_name)
    console.log('Event Time:', payload.event_time)
    console.log('Full Payload:', JSON.stringify(payload, null, 2))

    // 解析customData或passthrough数据
    let userData: { userId?: string, plan?: string } = {}
    
    if (payload.custom_data) {
      // 新的customData方式
      userData = {
        userId: payload.custom_data.userId,
        plan: payload.custom_data.plan
      }
      console.log('Parsed Custom Data:', userData)
    } else if (payload.passthrough) {
      // 旧的passthrough方式（向后兼容）
      try {
        userData = JSON.parse(payload.passthrough)
        console.log('Parsed Passthrough:', userData)
      } catch (parseError) {
        console.error('Failed to parse passthrough data:', parseError)
        return NextResponse.json({ 
          success: true, 
          warning: 'Invalid passthrough data' 
        })
      }
    }
    
    if (userData.userId && userData.plan) {
      // 处理成功支付事件
      if (payload.alert_name === 'subscription_payment_succeeded' || 
          payload.alert_name === 'payment_succeeded' ||
          payload.alert_name === 'transaction.completed') {
        
        console.log(`✅ Payment succeeded for user ${userData.userId}, plan: ${userData.plan}`)
        
        // 更新数据库中的Plus状态
        try {
          const now = new Date()
          const expireAt = new Date(now)
          if (userData.plan === 'yearly') {
            expireAt.setFullYear(expireAt.getFullYear() + 1)
          } else if (userData.plan === 'monthly') {
            expireAt.setMonth(expireAt.getMonth() + 1)
          }

          console.log('=== Updating Database ===', {
            userId: userData.userId,
            plan: userData.plan,
            expireAt: expireAt.toISOString(),
            timestamp: new Date().toISOString()
          })

          // 使用数据库函数更新Plus状态
          const { data, error } = await supabase.rpc('update_user_plus_status', {
            user_id: userData.userId,
            is_plus: true,
            is_active_param: true,
            expire_at_param: expireAt.toISOString(),
            plan_param: userData.plan
          })

          if (error) {
            console.error('=== Database Update Error ===', {
              userId: userData.userId,
              error,
              timestamp: new Date().toISOString()
            })
            
            // 尝试重试一次
            console.log('Retrying database update...')
            const { data: retryData, error: retryError } = await supabase.rpc('update_user_plus_status', {
              user_id: userData.userId,
              is_plus: true,
              is_active_param: true,
              expire_at_param: expireAt.toISOString(),
              plan_param: userData.plan
            })
            
            if (retryError) {
              console.error('Database retry also failed:', retryError)
            } else {
              console.log('Database retry succeeded:', retryData)
            }
          } else {
            console.log('=== Database Updated Successfully ===', {
              userId: userData.userId,
              result: data,
              timestamp: new Date().toISOString()
            })
          }
        } catch (dbError) {
          console.error('=== Database Operation Failed ===', {
            userId: userData.userId,
            error: dbError instanceof Error ? dbError.message : String(dbError),
            stack: dbError instanceof Error ? dbError.stack : undefined,
            timestamp: new Date().toISOString()
          })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Payment processed successfully',
          userId: userData.userId,
          plan: userData.plan
        })
      }
      
      // 处理取消事件
      if (payload.alert_name === 'subscription_cancelled') {
        console.log(`❌ Subscription cancelled for user ${userData.userId}`)
        return NextResponse.json({ 
          success: true, 
          message: 'Cancellation processed' 
        })
      }
    } else {
      console.log('No user data found in customData or passthrough')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received and logged' 
    })
    
  } catch (error) {
    const errorId = Math.random().toString(36).substring(7)
    console.error('=== Webhook Processing Error ===', {
      errorId,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      headers: Object.fromEntries(req.headers.entries()),
      bodyLength: body?.length || 0
    })
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      errorId,
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Paddle新版SDK签名验证函数
function verifyPaddleSignature(body: string, signature: string, secret: string): boolean {
  try {
    const crypto = require('crypto')
    
    // Paddle新版签名格式: "ts=timestamp;h1=signature"
    const signatureParts = signature.split(';')
    let timestamp = ''
    let hash = ''
    
    for (const part of signatureParts) {
      const [key, value] = part.split('=')
      if (key === 'ts') {
        timestamp = value
      } else if (key === 'h1') {
        hash = value
      }
    }
    
    if (!timestamp || !hash) {
      console.error('Invalid signature format, falling back to simple HMAC')
      // 回退到简单HMAC验证（兼容旧格式）
      const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')
      return signature === expectedSignature || signature === `sha256=${expectedSignature}`
    }
    
    // 新版验证：使用timestamp + body
    const payload = timestamp + ':' + body
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    
    console.log('Verifying Paddle webhook signature (new format)')
    console.log('Timestamp:', timestamp)
    console.log('Expected signature:', expectedSignature)
    console.log('Received signature:', hash)
    
    // 验证时间戳防重放攻击（5分钟容差）
    const now = Math.floor(Date.now() / 1000)
    const webhookTimestamp = parseInt(timestamp)
    const timeDiff = Math.abs(now - webhookTimestamp)
    
    if (timeDiff > 300) { // 5分钟
      console.error('Webhook timestamp too old:', timeDiff, 'seconds')
      return false
    }
    
    return hash === expectedSignature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}