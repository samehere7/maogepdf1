import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  // 测试1: 检查环境变量
  results.tests.push({
    name: "Environment Variables Check",
    result: {
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        length: process.env.DATABASE_URL?.length || 0,
        value: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@') : 'NOT_SET'
      },
      SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET'
      },
      SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      },
      SUPABASE_SERVICE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      }
    }
  })

  // 测试2: 直接使用 Supabase 客户端连接（不通过Prisma）
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // 测试简单查询
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)

      results.tests.push({
        name: "Direct Supabase Connection",
        result: {
          success: !error,
          error: error?.message || null,
          dataCount: data?.length || 0,
          canAccessUserProfiles: !error
        }
      })

      // 测试其他表
      const tables = ['user_daily_quota', 'plus', 'pdfs']
      for (const table of tables) {
        try {
          const { data: tableData, error: tableError } = await supabase
            .from(table)
            .select('*')
            .limit(0)

          results.tests.push({
            name: `Table Access Test: ${table}`,
            result: {
              exists: !tableError,
              error: tableError?.message || null
            }
          })
        } catch (e) {
          results.tests.push({
            name: `Table Access Test: ${table}`,
            result: {
              exists: false,
              error: e instanceof Error ? e.message : 'Unknown error'
            }
          })
        }
      }

    } catch (supabaseError) {
      results.tests.push({
        name: "Direct Supabase Connection",
        result: {
          success: false,
          error: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
        }
      })
    }
  } else {
    results.tests.push({
      name: "Direct Supabase Connection",
      result: {
        success: false,
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      }
    })
  }

  // 测试3: Prisma 连接 - 多种配置
  const prismaTests = [
    {
      name: "Prisma Default Config",
      config: {}
    },
    {
      name: "Prisma with Logging",
      config: { log: ['query', 'info', 'warn', 'error'] }
    },
    {
      name: "Prisma with Connection Pool",
      config: { 
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
      }
    }
  ]

  for (const test of prismaTests) {
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient(test.config as any)
      
      // 测试连接
      const startTime = Date.now()
      await prisma.$connect()
      const connectTime = Date.now() - startTime

      // 测试查询
      try {
        const queryStartTime = Date.now()
        await prisma.$queryRaw`SELECT 1 as test`
        const queryTime = Date.now() - queryStartTime

        results.tests.push({
          name: test.name,
          result: {
            success: true,
            connectTime: `${connectTime}ms`,
            queryTime: `${queryTime}ms`,
            canConnect: true,
            canQuery: true
          }
        })
      } catch (queryError) {
        results.tests.push({
          name: test.name,
          result: {
            success: false,
            connectTime: `${connectTime}ms`,
            canConnect: true,
            canQuery: false,
            queryError: queryError instanceof Error ? queryError.message : 'Unknown query error'
          }
        })
      }

      await prisma.$disconnect()

    } catch (prismaError) {
      results.tests.push({
        name: test.name,
        result: {
          success: false,
          canConnect: false,
          error: prismaError instanceof Error ? prismaError.message : 'Unknown error',
          errorType: prismaError instanceof Error ? prismaError.constructor.name : 'Unknown'
        }
      })
    }
  }

  // 测试4: 网络连接测试
  try {
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL)
      results.tests.push({
        name: "Network Configuration Analysis",
        result: {
          hostname: url.hostname,
          port: url.port || '5432',
          protocol: url.protocol,
          pathname: url.pathname,
          searchParams: Object.fromEntries(url.searchParams.entries()),
          hasSSL: url.searchParams.has('sslmode'),
          sslMode: url.searchParams.get('sslmode') || 'none',
          connectionLimit: url.searchParams.get('connection_limit') || 'default',
          poolTimeout: url.searchParams.get('pool_timeout') || 'default'
        }
      })
    }
  } catch (e) {
    results.tests.push({
      name: "Network Configuration Analysis",
      result: {
        error: e instanceof Error ? e.message : 'Cannot parse DATABASE_URL'
      }
    })
  }

  // 测试5: 替代连接字符串测试
  const alternativeUrls = [
    // 基础连接（无SSL）
    process.env.DATABASE_URL?.split('?')[0],
    // 只加 SSL
    process.env.DATABASE_URL?.split('?')[0] + '?sslmode=require',
    // SSL + 基础超时
    process.env.DATABASE_URL?.split('?')[0] + '?sslmode=require&connect_timeout=10',
  ].filter(Boolean)

  for (const altUrl of alternativeUrls) {
    try {
      const { PrismaClient } = await import('@prisma/client')
      
      // 临时覆盖环境变量进行测试
      const originalUrl = process.env.DATABASE_URL
      process.env.DATABASE_URL = altUrl
      
      const prisma = new PrismaClient()
      
      const startTime = Date.now()
      await prisma.$connect()
      const connectTime = Date.now() - startTime
      
      await prisma.$disconnect()
      
      // 恢复原始URL
      process.env.DATABASE_URL = originalUrl
      
      results.tests.push({
        name: `Alternative URL Test`,
        result: {
          success: true,
          url: altUrl?.replace(/:[^:@]*@/, ':***@'),
          connectTime: `${connectTime}ms`
        }
      })
      
    } catch (e) {
      results.tests.push({
        name: `Alternative URL Test`,
        result: {
          success: false,
          url: altUrl?.replace(/:[^:@]*@/, ':***@'),
          error: e instanceof Error ? e.message : 'Unknown error'
        }
      })
    }
  }

  return NextResponse.json(results, { 
    headers: { 
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    }
  })
}