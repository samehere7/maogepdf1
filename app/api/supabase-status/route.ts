import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: []
  }

  // 检查1: Supabase 项目状态
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )

      // 测试基础连接
      const { data, error } = await supabase.auth.getSession()
      
      results.checks.push({
        name: "Supabase Project Connection",
        success: !error,
        error: error?.message || null,
        status: "Supabase project is accessible"
      })

    } catch (e) {
      results.checks.push({
        name: "Supabase Project Connection",
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
        status: "Cannot connect to Supabase project"
      })
    }
  }

  // 检查2: 数据库是否活跃（通过 Supabase REST API）
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // 测试数据库查询 - 这会唤醒暂停的数据库
      const startTime = Date.now()
      const { data, error } = await supabaseAdmin
        .rpc('version') // PostgreSQL version function

      const responseTime = Date.now() - startTime

      if (error) {
        // 如果 RPC 失败，尝试简单的表查询
        const { data: tableData, error: tableError } = await supabaseAdmin
          .from('user_profiles')
          .select('count')
          .limit(0)

        results.checks.push({
          name: "Database Wake-up Test",
          success: !tableError,
          error: tableError?.message || null,
          responseTime: `${responseTime}ms`,
          note: tableError ? "Database might be paused" : "Database is active"
        })
      } else {
        results.checks.push({
          name: "Database Wake-up Test", 
          success: true,
          responseTime: `${responseTime}ms`,
          version: data,
          note: "Database is active and responding"
        })
      }

    } catch (e) {
      results.checks.push({
        name: "Database Wake-up Test",
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
        note: "Database connection failed - might be paused or network issue"
      })
    }
  }

  // 检查3: 网络延迟测试
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!)
    const host = url.hostname
    
    // 测试到 Supabase 的网络延迟
    const pingStart = Date.now()
    const response = await fetch(`https://${host}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      },
      signal: AbortSignal.timeout(15000)
    })
    const pingTime = Date.now() - pingStart

    results.checks.push({
      name: "Network Latency Test",
      success: response.ok,
      responseTime: `${pingTime}ms`,
      status: response.status,
      note: pingTime > 5000 ? "High latency detected" : "Network connectivity good"
    })

  } catch (e) {
    results.checks.push({
      name: "Network Latency Test",
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      note: "Network connectivity issue"
    })
  }

  // 检查4: 特定表的访问测试
  const tables = ['user_profiles', 'user_daily_quota', 'plus', 'pdfs']
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    for (const table of tables) {
      try {
        const startTime = Date.now()
        const { error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(0)
        const queryTime = Date.now() - startTime

        results.checks.push({
          name: `Table Access: ${table}`,
          success: !error,
          error: error?.message || null,
          queryTime: `${queryTime}ms`,
          note: error ? "Table access failed" : "Table accessible"
        })

      } catch (e) {
        results.checks.push({
          name: `Table Access: ${table}`,
          success: false,
          error: e instanceof Error ? e.message : 'Timeout or network error',
          note: "Table query failed"
        })
      }
    }
  }

  // 检查5: 数据库连接池状态
  try {
    const dbUrl = process.env.DATABASE_URL!
    const url = new URL(dbUrl)
    
    results.checks.push({
      name: "Database URL Analysis",
      success: true,
      config: {
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.slice(1),
        sslmode: url.searchParams.get('sslmode') || 'none',
        pool_timeout: url.searchParams.get('pool_timeout') || 'default',
        connection_limit: url.searchParams.get('connection_limit') || 'default',
        connect_timeout: url.searchParams.get('connect_timeout') || 'default'
      },
      note: "Database URL configuration parsed successfully"
    })

  } catch (e) {
    results.checks.push({
      name: "Database URL Analysis",
      success: false,
      error: e instanceof Error ? e.message : 'Cannot parse DATABASE_URL'
    })
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}