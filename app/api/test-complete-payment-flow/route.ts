import { NextResponse } from 'next/server'

export async function POST() {
  const testResults = {
    timestamp: new Date().toISOString(),
    testUserId: `test-user-${Date.now()}`,
    steps: []
  }

  try {
    // 1. 测试支付API
    const paymentResponse = await fetch('https://www.maogepdf.com/api/payment/paddle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: 'monthly',
        userId: testResults.testUserId
      })
    })

    const paymentData = await paymentResponse.json()
    testResults.steps.push({
      step: 1,
      name: 'Payment API Test',
      success: paymentResponse.ok && paymentData.mockPayment,
      status: paymentResponse.status,
      data: paymentData
    })

    // 2. 测试Webhook API
    if (paymentResponse.ok && paymentData.mockPayment) {
      const webhookResponse = await fetch('https://www.maogepdf.com/api/webhook/paddle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Test-Mode': 'true'
        },
        body: JSON.stringify({
          alert_name: 'subscription_payment_succeeded',
          event_time: new Date().toISOString(),
          custom_data: {
            userId: testResults.testUserId,
            plan: 'monthly',
            source: 'integration_test'
          }
        })
      })

      const webhookData = await webhookResponse.json()
      testResults.steps.push({
        step: 2,
        name: 'Webhook Processing Test',
        success: webhookResponse.ok && webhookData.success,
        status: webhookResponse.status,
        data: webhookData
      })
    }

    // 生成测试总结
    const successfulSteps = testResults.steps.filter(step => step.success).length
    const totalSteps = testResults.steps.length

    return NextResponse.json({
      ...testResults,
      summary: {
        overallSuccess: successfulSteps === totalSteps,
        successfulSteps,
        totalSteps,
        message: successfulSteps === totalSteps ? 
          '✅ 完整支付流程测试通过！用户可以正常升级Plus会员。' :
          `❌ ${totalSteps - successfulSteps} 个步骤失败，支付流程存在问题。`
      }
    })

  } catch (error) {
    return NextResponse.json({
      ...testResults,
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: {
        overallSuccess: false,
        message: '❌ 支付流程集成测试失败'
      }
    }, { status: 500 })
  }
}