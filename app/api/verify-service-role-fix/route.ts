import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: []
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      error: 'Missing Supabase configuration'
    }, { status: 500 })
  }

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

  // 测试所有主要表的访问
  const tablesToTest = [
    { name: 'user_profiles', operations: ['select', 'insert', 'update', 'delete'] },
    { name: 'user_daily_quota', operations: ['select', 'insert', 'update'] },
    { name: 'pdfs', operations: ['select', 'insert', 'update', 'delete'] },
    { name: 'plus', operations: ['select', 'insert', 'update'] }
  ]

  for (const table of tablesToTest) {
    const tableResults: any = {
      table: table.name,
      operations: {}
    }

    // 测试 SELECT
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(5)

      tableResults.operations.select = {
        success: !error,
        error: error?.message || null,
        recordCount: data?.length || 0
      }
    } catch (e) {
      tableResults.operations.select = {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // 测试 COUNT
    try {
      const { count, error } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })

      tableResults.operations.count = {
        success: !error,
        error: error?.message || null,
        totalRecords: count || 0
      }
    } catch (e) {
      tableResults.operations.count = {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    results.tests.push(tableResults)
  }

  // 测试 Storage 访问
  try {
    const { data, error } = await supabase.storage.listBuckets()
    results.storage = {
      accessible: !error,
      error: error?.message || null,
      buckets: data?.map(b => b.name) || []
    }
  } catch (e) {
    results.storage = {
      accessible: false,
      error: e instanceof Error ? e.message : 'Unknown error'
    }
  }

  // 测试 Auth Admin 访问
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    results.authAdmin = {
      accessible: !error,
      error: error?.message || null,
      userCount: data?.users?.length || 0
    }
  } catch (e) {
    results.authAdmin = {
      accessible: false,
      error: e instanceof Error ? e.message : 'Unknown error'
    }
  }

  // 生成总结
  const accessibleTables = results.tests.filter((test: any) => 
    test.operations.select?.success && test.operations.count?.success
  ).length
  
  const totalTables = results.tests.length
  const storageWorking = results.storage?.accessible || false
  const authWorking = results.authAdmin?.accessible || false

  results.summary = {
    tablesAccessible: accessibleTables,
    totalTables,
    storageAccessible: storageWorking,
    authAdminAccessible: authWorking,
    overallHealth: accessibleTables === totalTables && storageWorking && authWorking,
    score: `${accessibleTables}/${totalTables} tables + ${storageWorking ? 1 : 0}/1 storage + ${authWorking ? 1 : 0}/1 auth`,
    recommendation: accessibleTables === totalTables && storageWorking ?
      '✅ Service Role Key 工作完全正常！所有功能都可以访问。' :
      `⚠️ 还有问题：${totalTables - accessibleTables} 个表无法访问，存储${storageWorking ? '正常' : '失败'}，认证${authWorking ? '正常' : '失败'}`
  }

  return NextResponse.json(results)
}