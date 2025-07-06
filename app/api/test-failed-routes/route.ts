import { NextResponse } from 'next/server'

// 禁用静态生成，因为这个路由需要在运行时执行
export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.maogepdf.com'
  
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  // 测试失败的API路由
  const routesToTest = [
    '/api/user/profile',
    '/api/user/quota', 
    '/api/payment/paddle'
  ]

  for (const route of routesToTest) {
    try {
      let response: Response
      let testBody: any = {}
      
      if (route === '/api/payment/paddle') {
        // POST请求
        response = await fetch(`${baseUrl}${route}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: 'monthly',
            userId: 'test-user-id'
          })
        })
        testBody = { plan: 'monthly', userId: 'test-user-id' }
      } else {
        // GET请求，测试无auth header的情况
        response = await fetch(`${baseUrl}${route}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      }

      const responseText = await response.text()
      let responseData = null
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }

      testResults.tests.push({
        route,
        method: route === '/api/payment/paddle' ? 'POST' : 'GET',
        requestBody: route === '/api/payment/paddle' ? testBody : null,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        response: responseData,
        headers: Object.fromEntries(response.headers.entries())
      })

    } catch (error) {
      testResults.tests.push({
        route,
        method: route === '/api/payment/paddle' ? 'POST' : 'GET',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'NETWORK_ERROR'
      })
    }
  }

  // 生成总结
  const successfulTests = testResults.tests.filter(test => test.success).length
  const totalTests = testResults.tests.length

  const summary = {
    overallHealth: successfulTests === totalTests,
    successfulTests,
    totalTests,
    failedRoutes: testResults.tests.filter(test => !test.success).map(test => ({
      route: test.route,
      status: test.status,
      error: test.error || test.response?.error
    })),
    recommendation: successfulTests === totalTests ? 
      '✅ 所有API路由正常工作' :
      `❌ ${totalTests - successfulTests} 个API路由失败，需要修复`
  }

  return NextResponse.json({
    ...testResults,
    summary
  })
}