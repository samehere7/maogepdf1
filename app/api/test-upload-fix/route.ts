import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service-client'

export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  try {
    // 1. 测试user_profiles表访问
    const { data: profileTest, error: profileError } = await supabaseService
      .from('user_profiles')
      .select('id, email')
      .limit(1)

    testResults.tests.push({
      name: 'user_profiles表访问测试',
      success: !profileError,
      error: profileError?.message || null,
      recordCount: profileTest?.length || 0
    })

    // 2. 测试pdfs表访问
    const { data: pdfTest, error: pdfError } = await supabaseService
      .from('pdfs')
      .select('id, name')
      .limit(1)

    testResults.tests.push({
      name: 'pdfs表访问测试',
      success: !pdfError,
      error: pdfError?.message || null,
      recordCount: pdfTest?.length || 0
    })

    // 3. 测试插入权限（使用测试数据）
    const testUserId = `test-user-${Date.now()}`
    const { data: insertTest, error: insertError } = await supabaseService
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: `${testUserId}@test.com`,
        name: 'Test User'
      })
      .select()

    testResults.tests.push({
      name: 'user_profiles插入权限测试',
      success: !insertError,
      error: insertError?.message || null,
      inserted: !!insertTest
    })

    // 4. 清理测试数据
    if (!insertError) {
      await supabaseService
        .from('user_profiles')
        .delete()
        .eq('id', testUserId)
    }

    // 生成总结
    const successfulTests = testResults.tests.filter(test => test.success).length
    const totalTests = testResults.tests.length

    return NextResponse.json({
      ...testResults,
      summary: {
        overallSuccess: successfulTests === totalTests,
        successfulTests,
        totalTests,
        message: successfulTests === totalTests ? 
          '✅ 上传API数据库访问权限正常' :
          `❌ ${totalTests - successfulTests} 个数据库权限测试失败`
      }
    })

  } catch (error) {
    return NextResponse.json({
      ...testResults,
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: {
        overallSuccess: false,
        message: '❌ 上传API测试失败'
      }
    }, { status: 500 })
  }
}