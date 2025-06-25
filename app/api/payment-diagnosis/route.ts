import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  // 1. 检查支付相关环境变量
  const paymentEnvVars = {
    'PADDLE_API_KEY': process.env.PADDLE_API_KEY,
    'PADDLE_ENVIRONMENT': process.env.PADDLE_ENVIRONMENT,
    'PADDLE_TEST_MODE': process.env.PADDLE_TEST_MODE,
    'PADDLE_WEBHOOK_SECRET': process.env.PADDLE_WEBHOOK_SECRET,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  const envTest: any = {
    name: "Payment Environment Variables",
    variables: {},
    missing: [],
    configured: []
  }

  for (const [key, value] of Object.entries(paymentEnvVars)) {
    if (!value) {
      envTest.missing.push(key)
      envTest.variables[key] = { status: 'MISSING' }
    } else {
      envTest.configured.push(key)
      const masked = key.includes('KEY') || key.includes('SECRET') ? 
        value.substring(0, 8) + '***' + value.substring(value.length - 4) : value
      envTest.variables[key] = { 
        status: 'PRESENT', 
        length: value.length,
        masked: masked 
      }
    }
  }

  envTest.success = envTest.missing.length === 0
  results.tests.push(envTest)

  // 2. 测试 Supabase Service Role 连接（支付需要）
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      // 测试支付相关表访问
      const paymentTables = ['user_profiles', 'plus', 'user_daily_quota']
      const tableResults = []

      for (const table of paymentTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)

          tableResults.push({
            table,
            accessible: !error,
            error: error?.message || null,
            recordCount: data?.length || 0
          })
        } catch (e) {
          tableResults.push({
            table,
            accessible: false,
            error: e instanceof Error ? e.message : 'Unknown error'
          })
        }
      }

      results.tests.push({
        name: "Payment Tables Access Test",
        success: tableResults.every(r => r.accessible),
        tables: tableResults
      })

    } catch (e) {
      results.tests.push({
        name: "Payment Tables Access Test",
        success: false,
        error: e instanceof Error ? e.message : 'Supabase connection failed'
      })
    }
  }

  // 3. 测试 Paddle API 连接
  if (process.env.PADDLE_API_KEY) {
    try {
      const paddleResponse = await fetch('https://api.paddle.com/products', {
        headers: {
          'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      results.tests.push({
        name: "Paddle API Connection",
        success: paddleResponse.ok,
        status: paddleResponse.status,
        statusText: paddleResponse.statusText,
        note: paddleResponse.ok ? 'Paddle API accessible' : 'Paddle API connection failed'
      })

    } catch (e) {
      results.tests.push({
        name: "Paddle API Connection",
        success: false,
        error: e instanceof Error ? e.message : 'Network error'
      })
    }
  }

  // 4. 模拟支付流程测试
  try {
    // 测试用户查找（支付流程第一步）
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      // 模拟支付流程：查找用户
      const { data: users, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .limit(1)

      // 模拟支付流程：检查现有订阅
      const { data: subscriptions, error: subError } = await supabase
        .from('plus')
        .select('*')
        .limit(1)

      results.tests.push({
        name: "Payment Flow Simulation",
        success: !userError && !subError,
        steps: {
          userLookup: {
            success: !userError,
            error: userError?.message || null,
            userCount: users?.length || 0
          },
          subscriptionCheck: {
            success: !subError,
            error: subError?.message || null,
            subscriptionCount: subscriptions?.length || 0
          }
        }
      })
    }

  } catch (e) {
    results.tests.push({
      name: "Payment Flow Simulation",
      success: false,
      error: e instanceof Error ? e.message : 'Payment flow test failed'
    })
  }

  // 生成诊断总结
  const successfulTests = results.tests.filter(test => test.success).length
  const totalTests = results.tests.length

  results.summary = {
    overallHealth: successfulTests === totalTests,
    successfulTests,
    totalTests,
    issues: results.tests.filter(test => !test.success).map(test => test.name),
    recommendation: successfulTests === totalTests ? 
      '✅ 支付系统配置完全正常，应该可以正常工作' :
      `❌ 发现 ${totalTests - successfulTests} 个支付配置问题需要修复`
  }

  return NextResponse.json(results)
}