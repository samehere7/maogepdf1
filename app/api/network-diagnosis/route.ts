import { NextResponse } from 'next/server'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  // 1. 测试到 Supabase 各种服务的连接
  const supabaseHost = 'pwlvfmywfzllopuiisxg.supabase.co'
  const endpoints = [
    { name: 'REST API', url: `https://${supabaseHost}/rest/v1/` },
    { name: 'Auth API', url: `https://${supabaseHost}/auth/v1/health` },
    { name: 'Storage API', url: `https://${supabaseHost}/storage/v1/` },
    { name: 'Realtime', url: `https://${supabaseHost}/realtime/v1/` }
  ]

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now()
      const response = await fetch(endpoint.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Vercel-Function-Network-Test'
        }
      })
      const responseTime = Date.now() - startTime

      results.tests.push({
        name: `${endpoint.name} Connectivity`,
        success: response.ok,
        status: response.status,
        responseTime: `${responseTime}ms`,
        url: endpoint.url,
        note: responseTime > 3000 ? 'High latency detected' : 'Normal response'
      })
    } catch (error) {
      results.tests.push({
        name: `${endpoint.name} Connectivity`,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url: endpoint.url
      })
    }
  }

  // 2. 测试数据库端口连接（间接测试）
  try {
    const dbHost = 'db.pwlvfmywfzllopuiisxg.supabase.co'
    
    // 尝试 DNS 解析测试
    const dnsStart = Date.now()
    try {
      // 使用 DNS over HTTPS 检查域名解析
      const dnsResponse = await fetch(`https://dns.google/resolve?name=${dbHost}&type=A`)
      const dnsTime = Date.now() - dnsStart
      const dnsData = await dnsResponse.json()
      
      results.tests.push({
        name: 'Database Host DNS Resolution',
        success: dnsData.Status === 0,
        responseTime: `${dnsTime}ms`,
        resolved: dnsData.Answer?.map((a: any) => a.data) || [],
        note: 'DNS resolution test for database host'
      })
    } catch (dnsError) {
      results.tests.push({
        name: 'Database Host DNS Resolution',
        success: false,
        error: dnsError instanceof Error ? dnsError.message : 'DNS resolution failed'
      })
    }

    // 网络路径测试（使用其他端口）
    const networkTest = []
    const testPorts = [443, 80] // 测试这些端口的连通性作为网络参考
    
    for (const port of testPorts) {
      try {
        const testStart = Date.now()
        const testResponse = await fetch(`https://${supabaseHost}:${port}/`, {
          method: 'HEAD'
        }).catch(() => null)
        const testTime = Date.now() - testStart
        
        networkTest.push({
          port,
          reachable: !!testResponse,
          time: `${testTime}ms`
        })
      } catch (e) {
        networkTest.push({
          port,
          reachable: false,
          error: e instanceof Error ? e.message : 'Unknown'
        })
      }
    }
    
    results.tests.push({
      name: 'Network Path Analysis',
      success: networkTest.some(t => t.reachable),
      ports: networkTest,
      note: 'Testing network connectivity to Supabase host'
    })

  } catch (error) {
    results.tests.push({
      name: 'Network Analysis',
      success: false,
      error: error instanceof Error ? error.message : 'Network analysis failed'
    })
  }

  // 3. 环境信息
  results.tests.push({
    name: 'Vercel Environment Info',
    success: true,
    info: {
      region: process.env.VERCEL_REGION || 'unknown',
      deployment: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
      nodeVersion: process.version,
      timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
      memoryUsage: process.memoryUsage(),
      platform: process.platform
    }
  })

  // 4. 数据库连接字符串分析
  if (process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL)
      const dbAnalysis = {
        protocol: dbUrl.protocol,
        host: dbUrl.hostname,
        port: dbUrl.port || '5432',
        database: dbUrl.pathname.slice(1),
        hasCredentials: !!(dbUrl.username && dbUrl.password),
        sslMode: dbUrl.searchParams.get('sslmode') || 'none',
        allParams: Object.fromEntries(dbUrl.searchParams.entries())
      }

      // 检查必需参数
      const requiredForSupabase = ['sslmode']
      const missingParams = requiredForSupabase.filter(param => !dbUrl.searchParams.has(param))

      results.tests.push({
        name: 'Database Connection String Analysis',
        success: missingParams.length === 0,
        analysis: dbAnalysis,
        missingParams,
        recommendation: missingParams.length > 0 ? 
          `Missing required parameters: ${missingParams.join(', ')}` : 
          'Connection string appears correctly formatted'
      })

    } catch (error) {
      results.tests.push({
        name: 'Database Connection String Analysis',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse DATABASE_URL'
      })
    }
  }

  // 5. 生成建议
  const failedTests = results.tests.filter(test => !test.success)
  const recommendations = []

  if (failedTests.some(test => test.name.includes('DNS'))) {
    recommendations.push('🌐 DNS 解析失败 - 可能是网络连接问题')
  }
  
  if (failedTests.some(test => test.name.includes('Connectivity'))) {
    recommendations.push('🔗 Supabase 服务连接失败 - 检查 Supabase 项目状态')
  }
  
  if (failedTests.some(test => test.name.includes('Network'))) {
    recommendations.push('📡 网络路径问题 - 可能是 Vercel 到 Supabase 的连接限制')
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ 网络连接正常 - 问题可能在数据库配置或权限')
  }

  results.summary = {
    totalTests: results.tests.length,
    successful: results.tests.filter(t => t.success).length,
    failed: failedTests.length,
    recommendations
  }

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}