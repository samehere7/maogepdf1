import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
    }

    // 检查环境变量
    debugInfo.environmentVariables = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置（长度:' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : '未配置',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '已配置（长度:' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : '未配置',
      PADDLE_API_KEY: process.env.PADDLE_API_KEY ? '已配置' : '未配置',
      PADDLE_TEST_MODE: process.env.PADDLE_TEST_MODE || '未设置',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '未配置'
    }

    // 测试 Supabase 连接
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()
      
      debugInfo.supabaseConnection = {
        status: error ? 'error' : 'success',
        error: error?.message || null,
        hasSession: !!data.session
      }

      // 如果有认证头，测试 service role 客户端
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        try {
          const { supabaseService } = await import('@/lib/supabase/service-client')
          const { data: testData, error: testError } = await supabaseService
            .from('user_profiles')
            .select('id')
            .limit(1)
          
          debugInfo.serviceRoleTest = {
            status: testError ? 'error' : 'success',
            error: testError?.message || null,
            canAccessUserProfiles: !testError
          }
        } catch (serviceError) {
          debugInfo.serviceRoleTest = {
            status: 'error',
            error: serviceError instanceof Error ? serviceError.message : 'Unknown error'
          }
        }
      }

    } catch (supabaseError) {
      debugInfo.supabaseConnection = {
        status: 'error',
        error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
      }
    }

    // 检查数据库表是否存在
    try {
      const { supabaseService } = await import('@/lib/supabase/service-client')
      
      // 测试各个表的存在性
      const tables = ['user_profiles', 'user_daily_quota', 'plus']
      debugInfo.databaseTables = {}
      
      for (const table of tables) {
        try {
          const { error } = await supabaseService
            .from(table)
            .select('*')
            .limit(0)
          
          debugInfo.databaseTables[table] = {
            exists: !error,
            error: error?.message || null
          }
        } catch (e) {
          debugInfo.databaseTables[table] = {
            exists: false,
            error: e instanceof Error ? e.message : 'Unknown error'
          }
        }
      }
    } catch (e) {
      debugInfo.databaseTables = {
        error: e instanceof Error ? e.message : 'Cannot access service client'
      }
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'test-auth') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader) {
        return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
      }

      const token = authHeader.replace('Bearer ', '')
      const supabase = createClient()
      
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      return NextResponse.json({
        success: !error,
        user: user ? {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        } : null,
        error: error?.message || null
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug POST endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}