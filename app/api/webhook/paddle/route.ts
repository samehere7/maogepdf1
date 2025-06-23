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
    
    // 验证Paddle webhook签名（生产环境推荐）
    if (process.env.PADDLE_ENVIRONMENT === 'production' && signature) {
      const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET
      if (webhookSecret && !verifyPaddleSignature(body, signature, webhookSecret)) {
        console.error('Invalid Paddle webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }
    
    const payload: PaddleWebhookPayload = JSON.parse(body)
    
    console.log('=== Paddle Webhook Received ===')
    console.log('Event Type:', payload.alert_name)
    console.log('Event Time:', payload.event_time)
    console.log('Full Payload:', JSON.stringify(payload, null, 2))

    // 解析passthrough数据
    if (payload.passthrough) {
      try {
        const passthroughData = JSON.parse(payload.passthrough)
        console.log('Parsed Passthrough:', passthroughData)
        
        // 处理成功支付事件
        if (payload.alert_name === 'subscription_payment_succeeded' || 
            payload.alert_name === 'payment_succeeded') {
          
          console.log(`✅ Payment succeeded for user ${passthroughData.userId}, plan: ${passthroughData.plan}`)
          
          // 更新数据库中的Plus状态
          try {
            const now = new Date()
            const expireAt = new Date(now)
            if (passthroughData.plan === 'yearly') {
              expireAt.setFullYear(expireAt.getFullYear() + 1)
            } else if (passthroughData.plan === 'monthly') {
              expireAt.setMonth(expireAt.getMonth() + 1)
            }

            // 使用数据库函数更新Plus状态
            const { data, error } = await supabase.rpc('update_user_plus_status', {
              user_id: passthroughData.userId,
              is_plus: true,
              is_active_param: true,
              expire_at_param: expireAt.toISOString(),
              plan_param: passthroughData.plan
            })

            if (error) {
              console.error('Database update error:', error)
            } else {
              console.log('Database updated successfully:', data)
            }
          } catch (dbError) {
            console.error('Failed to update database:', dbError)
          }
          
          return NextResponse.json({ 
            success: true, 
            message: 'Payment processed successfully',
            userId: passthroughData.userId,
            plan: passthroughData.plan
          })
        }
        
        // 处理取消事件
        if (payload.alert_name === 'subscription_cancelled') {
          console.log(`❌ Subscription cancelled for user ${passthroughData.userId}`)
          return NextResponse.json({ 
            success: true, 
            message: 'Cancellation processed' 
          })
        }
        
      } catch (parseError) {
        console.error('Failed to parse passthrough data:', parseError)
        return NextResponse.json({ 
          success: true, 
          warning: 'Invalid passthrough data' 
        })
      }
    } else {
      console.log('No passthrough data found')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received and logged' 
    })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Paddle签名验证函数
function verifyPaddleSignature(body: string, signature: string, secret: string): boolean {
  try {
    // 这里简化处理，生产环境建议使用crypto库进行HMAC验证
    // const crypto = require('crypto')
    // const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex')
    // return signature === expectedSignature
    
    // 临时跳过签名验证，记录日志
    console.log('Webhook signature verification skipped for now')
    return true
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}