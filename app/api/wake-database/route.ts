import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const results: any = {
    timestamp: new Date().toISOString(),
    wakeupAttempts: []
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      error: "Missing Supabase configuration",
      details: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found"
    }, { status: 500 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // 尝试多种方式唤醒数据库
  
  // 方法1: 简单的心跳查询
  try {
    const startTime = Date.now()
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(0)
    
    const responseTime = Date.now() - startTime
    
    results.wakeupAttempts.push({
      method: "Simple table query",
      success: !error,
      responseTime: `${responseTime}ms`,
      error: error?.message || null,
      note: responseTime > 10000 ? "Database was likely paused, now waking up" : "Database already active"
    })

  } catch (e) {
    results.wakeupAttempts.push({
      method: "Simple table query",
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error'
    })
  }

  // 方法2: 尝试创建数据库连接（如果上面失败）
  if (results.wakeupAttempts[0]?.success === false) {
    try {
      const startTime = Date.now()
      const { data, error } = await supabaseAdmin
        .rpc('version')
      
      const responseTime = Date.now() - startTime
      
      results.wakeupAttempts.push({
        method: "Database version check",
        success: !error,
        responseTime: `${responseTime}ms`,
        error: error?.message || null,
        version: data || null
      })

    } catch (e) {
      results.wakeupAttempts.push({
        method: "Database version check", 
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }
  }

  // 方法3: 如果还是失败，尝试基础的 health check
  const hasSuccess = results.wakeupAttempts.some(attempt => attempt.success)
  
  if (!hasSuccess) {
    try {
      // 直接尝试REST API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_profiles?select=count&limit=0`,
        {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          // signal: AbortSignal.timeout(60000) // 60秒超时
        }
      )

      results.wakeupAttempts.push({
        method: "Direct REST API call",
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : null
      })

      if (response.ok) {
        const data = await response.text()
        results.wakeupAttempts[results.wakeupAttempts.length - 1].responseData = data
      }

    } catch (e) {
      results.wakeupAttempts.push({
        method: "Direct REST API call",
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      })
    }
  }

  // 检查最终状态
  const finalSuccess = results.wakeupAttempts.some(attempt => attempt.success)
  
  if (finalSuccess) {
    // 如果成功唤醒，等待一下然后测试 Prisma 连接
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)) // 等待2秒
      
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      const startTime = Date.now()
      await prisma.$connect()
      const connectTime = Date.now() - startTime
      
      await prisma.$queryRaw`SELECT 1 as test`
      await prisma.$disconnect()
      
      results.prismaTest = {
        success: true,
        connectTime: `${connectTime}ms`,
        note: "Prisma connection successful after wakeup"
      }
      
    } catch (e) {
      results.prismaTest = {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
        note: "Prisma connection still failing after wakeup"
      }
    }
  }

  results.summary = {
    databaseWokenUp: finalSuccess,
    recommendedAction: finalSuccess 
      ? "Database is now active. Try your operations again." 
      : "Database wakeup failed. This might indicate a more serious connectivity issue."
  }

  return NextResponse.json(results)
}