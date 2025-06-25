import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const diagnosis: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: {
      region: process.env.VERCEL_REGION || 'unknown',
      deployment: process.env.VERCEL_DEPLOYMENT_ID || 'unknown'
    },
    tests: []
  }

  // ===== 环境变量超详细检查 =====
  const envVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'PADDLE_API_KEY': process.env.PADDLE_API_KEY,
    'PADDLE_ENVIRONMENT': process.env.PADDLE_ENVIRONMENT,
    'PADDLE_TEST_MODE': process.env.PADDLE_TEST_MODE,
    'NODE_ENV': process.env.NODE_ENV,
    'VERCEL': process.env.VERCEL,
    'VERCEL_ENV': process.env.VERCEL_ENV
  }

  const envTest: any = {
    name: "Complete Environment Variables Analysis",
    variables: {},
    missing: [],
    invalid: []
  }

  for (const [key, value] of Object.entries(envVars)) {
    if (!value) {
      envTest.missing.push(key)
      envTest.variables[key] = { status: 'MISSING', value: null }
    } else {
      const masked = key.includes('KEY') || key.includes('SECRET') || key.includes('URL') ? 
        value.substring(0, 10) + '***' + value.substring(value.length - 5) : value
      
      envTest.variables[key] = {
        status: 'PRESENT',
        length: value.length,
        masked: masked,
        startsWithCorrectPrefix: validateEnvVarPrefix(key, value)
      }
      
      if (!validateEnvVarPrefix(key, value)) {
        envTest.invalid.push(key)
      }
    }
  }

  envTest.success = envTest.missing.length === 0 && envTest.invalid.length === 0
  diagnosis.tests.push(envTest)

  // ===== DATABASE_URL 超详细解析 =====
  if (process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL)
      diagnosis.tests.push({
        name: "DATABASE_URL Deep Analysis",
        success: true,
        parsed: {
          protocol: dbUrl.protocol,
          hostname: dbUrl.hostname,
          port: dbUrl.port || '5432',
          database: dbUrl.pathname.slice(1),
          username: dbUrl.username,
          hasPassword: !!dbUrl.password,
          passwordLength: dbUrl.password?.length || 0,
          searchParams: Object.fromEntries(dbUrl.searchParams.entries()),
          fullUrl: process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@')
        },
        validation: {
          hasSSL: dbUrl.searchParams.has('sslmode'),
          sslMode: dbUrl.searchParams.get('sslmode') || 'none',
          hasPoolConfig: dbUrl.searchParams.has('pool_timeout') || dbUrl.searchParams.has('connection_limit'),
          isSupabaseUrl: dbUrl.hostname.includes('supabase.co'),
          portCorrect: dbUrl.port === '5432' || !dbUrl.port
        }
      })
    } catch (e) {
      diagnosis.tests.push({
        name: "DATABASE_URL Deep Analysis",
        success: false,
        error: e instanceof Error ? e.message : 'Invalid URL format'
      })
    }
  }

  // ===== Prisma 客户端详细测试 =====
  try {
    const { PrismaClient } = await import('@prisma/client')
    
    // 测试多种 Prisma 配置
    const prismaConfigs = [
      { name: 'Default', config: {} },
      { name: 'With Logging', config: { log: ['error'] } },
      { name: 'With Error Format', config: { errorFormat: 'pretty' } }
    ]

    for (const { name, config } of prismaConfigs) {
      try {
        const prisma = new PrismaClient(config as any)
        
        const connectStart = Date.now()
        await prisma.$connect()
        const connectTime = Date.now() - connectStart
        
        // 测试不同的查询
        const queries = [
          { name: 'Raw Query', fn: () => prisma.$queryRaw`SELECT 1 as test` },
          { name: 'User Profiles Count', fn: () => prisma.user_profiles.count() },
          { name: 'PDFs Count', fn: () => prisma.pdfs.count() }
        ]
        
        const queryResults = []
        for (const query of queries) {
          try {
            const queryStart = Date.now()
            const result = await query.fn()
            const queryTime = Date.now() - queryStart
            
            queryResults.push({
              name: query.name,
              success: true,
              time: `${queryTime}ms`,
              result: typeof result === 'object' ? JSON.stringify(result).substring(0, 100) : result
            })
          } catch (qError) {
            queryResults.push({
              name: query.name,
              success: false,
              error: qError instanceof Error ? qError.message : 'Unknown error'
            })
          }
        }
        
        await prisma.$disconnect()
        
        diagnosis.tests.push({
          name: `Prisma Test: ${name}`,
          success: queryResults.some(q => q.success),
          connectTime: `${connectTime}ms`,
          queries: queryResults
        })
        
      } catch (pError) {
        diagnosis.tests.push({
          name: `Prisma Test: ${name}`,
          success: false,
          error: pError instanceof Error ? pError.message : 'Unknown error',
          errorType: pError instanceof Error ? pError.constructor.name : 'Unknown'
        })
      }
    }
  } catch (importError) {
    diagnosis.tests.push({
      name: "Prisma Import Test",
      success: false,
      error: importError instanceof Error ? importError.message : 'Cannot import Prisma'
    })
  }

  // ===== Supabase 多客户端测试 =====
  const supabaseTests = [
    {
      name: 'Anon Client',
      client: () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    },
    {
      name: 'Service Role Client',
      client: () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
    }
  ]

  for (const test of supabaseTests) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && 
        (test.name === 'Anon Client' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      
      try {
        const supabase = test.client()
        
        // 测试不同操作
        const operations = [
          {
            name: 'Auth Session',
            fn: () => supabase.auth.getSession()
          },
          {
            name: 'Table Query - user_profiles',
            fn: () => supabase.from('user_profiles').select('count').limit(0)
          },
          {
            name: 'Storage List',
            fn: () => supabase.storage.listBuckets()
          }
        ]
        
        const operationResults = []
        for (const op of operations) {
          try {
            const opStart = Date.now()
            const { data, error } = await op.fn() as any
            const opTime = Date.now() - opStart
            
            operationResults.push({
              name: op.name,
              success: !error,
              time: `${opTime}ms`,
              error: error?.message || null,
              hasData: !!data
            })
          } catch (opError) {
            operationResults.push({
              name: op.name,
              success: false,
              error: opError instanceof Error ? opError.message : 'Unknown error'
            })
          }
        }
        
        diagnosis.tests.push({
          name: `Supabase ${test.name}`,
          success: operationResults.some(op => op.success),
          operations: operationResults
        })
        
      } catch (sError) {
        diagnosis.tests.push({
          name: `Supabase ${test.name}`,
          success: false,
          error: sError instanceof Error ? sError.message : 'Client creation failed'
        })
      }
    }
  }

  // ===== 网络和延迟测试 =====
  try {
    const networkTests = []
    
    // 测试到 Supabase 的连接
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const pingStart = Date.now()
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        }
      })
      const pingTime = Date.now() - pingStart
      
      networkTests.push({
        target: 'Supabase REST API',
        success: response.ok,
        status: response.status,
        time: `${pingTime}ms`,
        note: pingTime > 3000 ? 'High latency' : 'Normal latency'
      })
    }
    
    // 测试到数据库的连接
    if (process.env.DATABASE_URL) {
      const dbUrl = new URL(process.env.DATABASE_URL)
      const dbPingStart = Date.now()
      
      try {
        // 使用 telnet-like 测试
        const dbResponse = await fetch(`https://${dbUrl.hostname}:${dbUrl.port || '5432'}`, {
          method: 'HEAD'
        }).catch(() => null)
        
        const dbPingTime = Date.now() - dbPingStart
        networkTests.push({
          target: 'Database Server',
          success: false, // 这个测试预期会失败，但能测试网络可达性
          time: `${dbPingTime}ms`,
          note: 'Direct database connection test (expected to fail but tests network)'
        })
      } catch (e) {
        networkTests.push({
          target: 'Database Server',
          success: false,
          error: e instanceof Error ? e.message : 'Network test failed'
        })
      }
    }
    
    diagnosis.tests.push({
      name: "Network Connectivity Tests",
      success: networkTests.some(test => test.success),
      tests: networkTests
    })
    
  } catch (networkError) {
    diagnosis.tests.push({
      name: "Network Connectivity Tests",
      success: false,
      error: networkError instanceof Error ? networkError.message : 'Network tests failed'
    })
  }

  // ===== 系统信息 =====
  diagnosis.tests.push({
    name: "System Information",
    success: true,
    info: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  })

  // ===== 总结和建议 =====
  const failedTests = diagnosis.tests.filter(test => !test.success)
  const successfulTests = diagnosis.tests.filter(test => test.success)
  
  diagnosis.summary = {
    totalTests: diagnosis.tests.length,
    successful: successfulTests.length,
    failed: failedTests.length,
    criticalIssues: failedTests.filter(test => 
      test.name.includes('Prisma') || 
      test.name.includes('DATABASE_URL') || 
      test.name.includes('Environment')
    ),
    recommendations: generateRecommendations(diagnosis.tests)
  }

  return NextResponse.json(diagnosis, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

// 验证环境变量前缀
function validateEnvVarPrefix(key: string, value: string): boolean {
  switch (key) {
    case 'DATABASE_URL':
      return value.startsWith('postgresql://') || value.startsWith('postgres://')
    case 'NEXT_PUBLIC_SUPABASE_URL':
      return value.startsWith('https://') && value.includes('supabase.co')
    case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
      return value.startsWith('eyJ') // JWT token
    case 'SUPABASE_SERVICE_ROLE_KEY':
      return value.startsWith('eyJ') // JWT token
    case 'PADDLE_API_KEY':
      return value.startsWith('pdl_')
    default:
      return true
  }
}

// 生成建议
function generateRecommendations(tests: any[]): string[] {
  const recommendations = []
  
  const envTest = tests.find(t => t.name === 'Complete Environment Variables Analysis')
  if (envTest && !envTest.success) {
    if (envTest.missing.includes('DATABASE_URL')) {
      recommendations.push('❌ DATABASE_URL 环境变量缺失 - 这是主要问题！')
    }
    if (envTest.missing.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      recommendations.push('⚠️ SUPABASE_SERVICE_ROLE_KEY 缺失，会影响管理员操作')
    }
  }
  
  const prismaTests = tests.filter(t => t.name.includes('Prisma'))
  if (prismaTests.every(t => !t.success)) {
    recommendations.push('🔥 所有 Prisma 连接都失败 - 检查数据库配置')
  }
  
  const supabaseTests = tests.filter(t => t.name.includes('Supabase'))
  if (supabaseTests.every(t => !t.success)) {
    recommendations.push('🔥 所有 Supabase 连接都失败 - 检查 Supabase 配置')
  }
  
  const networkTest = tests.find(t => t.name === 'Network Connectivity Tests')
  if (networkTest && !networkTest.success) {
    recommendations.push('🌐 网络连接问题 - 可能是防火墙或网络限制')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ 未发现明显配置问题，可能是 Supabase 数据库暂停')
  }
  
  return recommendations
}