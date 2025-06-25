import { NextRequest, NextResponse } from 'next/server'
import { URL } from 'url'

export async function GET() {
  try {
    const diagnosis: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }

    // 1. 检查 DATABASE_URL 环境变量
    const databaseUrl = process.env.DATABASE_URL
    diagnosis.databaseUrl = {
      exists: !!databaseUrl,
      length: databaseUrl?.length || 0,
      maskedUrl: databaseUrl ? 
        databaseUrl.replace(/:[^:@]*@/, ':***@') : 'NOT_SET'
    }

    if (databaseUrl) {
      try {
        // 2. 解析连接字符串
        const url = new URL(databaseUrl)
        diagnosis.connectionString = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || '5432',
          database: url.pathname.slice(1),
          username: url.username || 'NOT_SET',
          hasPassword: !!url.password,
          searchParams: Object.fromEntries(url.searchParams.entries())
        }

        // 3. 检查必需的连接参数
        const requiredParams = ['sslmode', 'pool_timeout', 'connection_limit', 'connect_timeout']
        diagnosis.missingParams = requiredParams.filter(param => 
          !url.searchParams.has(param)
        )

        // 4. 检查 SSL 配置
        diagnosis.sslConfig = {
          hasSSL: url.searchParams.has('sslmode'),
          sslMode: url.searchParams.get('sslmode') || 'NOT_SET',
          recommended: 'require'
        }

        // 5. 检查连接池配置
        diagnosis.connectionPool = {
          connectionLimit: url.searchParams.get('connection_limit') || 'NOT_SET',
          poolTimeout: url.searchParams.get('pool_timeout') || 'NOT_SET',
          connectTimeout: url.searchParams.get('connect_timeout') || 'NOT_SET',
          recommended: {
            connection_limit: '10',
            pool_timeout: '10',
            connect_timeout: '30'
          }
        }

      } catch (urlError) {
        diagnosis.connectionString = {
          error: 'Invalid URL format',
          details: urlError instanceof Error ? urlError.message : 'Unknown error'
        }
      }
    }

    // 6. 尝试网络连接测试
    try {
      const url = new URL(databaseUrl!)
      const host = url.hostname
      const port = parseInt(url.port || '5432')

      // 简单的网络可达性测试
      diagnosis.networkTest = {
        host,
        port,
        status: 'testing'
      }

      // 使用 fetch 测试网络连接（虽然不是真正的数据库连接，但可以测试网络可达性）
      const testStart = Date.now()
      try {
        // 这里我们不能直接测试 PostgreSQL 连接，但可以尝试其他方式
        diagnosis.networkTest.status = 'cannot_test_directly'
        diagnosis.networkTest.note = 'Network connectivity test requires actual database client'
      } catch (e) {
        diagnosis.networkTest.status = 'network_error'
        diagnosis.networkTest.error = e instanceof Error ? e.message : 'Unknown error'
      }

    } catch (e) {
      diagnosis.networkTest = {
        status: 'error',
        error: e instanceof Error ? e.message : 'Cannot parse URL for network test'
      }
    }

    // 7. 测试 Prisma 连接
    try {
      const { PrismaClient } = await import('@/lib/generated/prisma')
      const prisma = new PrismaClient({
        log: ['error'],
        errorFormat: 'pretty'
      })
      
      const connectStart = Date.now()
      await prisma.$connect()
      const connectTime = Date.now() - connectStart
      
      diagnosis.prismaConnection = {
        status: 'success',
        connectTime: `${connectTime}ms`,
        canConnect: true
      }
      
      // 测试查询
      try {
        const queryStart = Date.now()
        await prisma.$queryRaw`SELECT 1 as test`
        const queryTime = Date.now() - queryStart
        
        diagnosis.prismaConnection.canQuery = true
        diagnosis.prismaConnection.queryTime = `${queryTime}ms`
      } catch (queryError) {
        diagnosis.prismaConnection.canQuery = false
        diagnosis.prismaConnection.queryError = queryError instanceof Error ? queryError.message : 'Unknown query error'
      }
      
      await prisma.$disconnect()
      
    } catch (prismaError) {
      diagnosis.prismaConnection = {
        status: 'error',
        canConnect: false,
        error: prismaError instanceof Error ? prismaError.message : 'Unknown Prisma error',
        errorType: prismaError instanceof Error ? prismaError.constructor.name : 'Unknown'
      }
    }

    // 8. 生成修复建议
    if (diagnosis.databaseUrl.exists && diagnosis.missingParams.length > 0) {
      const currentUrl = new URL(databaseUrl!)
      
      // 添加推荐的参数
      if (!currentUrl.searchParams.has('sslmode')) {
        currentUrl.searchParams.set('sslmode', 'require')
      }
      if (!currentUrl.searchParams.has('pool_timeout')) {
        currentUrl.searchParams.set('pool_timeout', '10')
      }
      if (!currentUrl.searchParams.has('connection_limit')) {
        currentUrl.searchParams.set('connection_limit', '10')
      }
      if (!currentUrl.searchParams.has('connect_timeout')) {
        currentUrl.searchParams.set('connect_timeout', '30')
      }

      diagnosis.recommendedUrl = currentUrl.toString().replace(/:[^:@]*@/, ':***@')
    }

    return NextResponse.json(diagnosis)

  } catch (error) {
    return NextResponse.json({
      error: 'Database diagnosis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}