const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pwlvfmywfzllopuiisxg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.CkPzDehpjCsiH7ZpLPtu8LUZzr5q1w4iTHp-Z_bobLk'

// 创建服务角色客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnosePermissions() {
  console.log('🔍 开始诊断Supabase权限问题...\n')

  try {
    // 1. 测试基本连接
    console.log('1. 测试基本连接...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('pdfs')
      .select('count(*)', { count: 'exact', head: true })
    
    if (healthError) {
      console.error('❌ 基本连接失败:', healthError.message)
      return
    }
    console.log('✅ 基本连接成功')

    // 2. 检查pdfs表结构
    console.log('\n2. 检查pdfs表结构...')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'pdfs' })
      .catch(() => {
        // 如果没有这个函数，我们用另一种方法
        return supabase
          .from('pdfs')
          .select('*')
          .limit(1)
      })

    if (tableError) {
      console.log('⚠️ 无法获取表结构详情:', tableError.message)
    } else {
      console.log('✅ pdfs表存在且可访问')
    }

    // 3. 测试创建记录权限
    console.log('\n3. 测试创建PDF记录权限...')
    const testPdfId = 'test-pdf-' + Date.now()
    const { data: createResult, error: createError } = await supabase
      .from('pdfs')
      .insert({
        id: testPdfId,
        name: 'Test PDF Document',
        url: 'temp://test-document',
        size: 0,
        user_id: null // 测试匿名用户
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ 创建PDF记录失败:', createError)
      console.error('错误详情:', JSON.stringify(createError, null, 2))
      
      // 检查是否是RLS策略问题
      if (createError.code === '42501' || createError.message.includes('policy')) {
        console.log('\n🔐 这是RLS策略权限问题')
      }
    } else {
      console.log('✅ 创建PDF记录成功:', createResult)
      
      // 清理测试记录
      await supabase.from('pdfs').delete().eq('id', testPdfId)
      console.log('🧹 已清理测试记录')
    }

    // 4. 检查RLS策略
    console.log('\n4. 检查RLS策略...')
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'pdfs')

    if (policyError) {
      console.log('⚠️ 无法查询RLS策略:', policyError.message)
    } else {
      console.log('📋 pdfs表的RLS策略:')
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? '允许' : '限制'})`)
        console.log(`    条件: ${policy.qual || '无'}`)
        console.log(`    检查: ${policy.with_check || '无'}`)
        console.log('')
      })
    }

    // 5. 检查表的RLS状态
    console.log('5. 检查表的RLS状态...')
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'pdfs')
      .single()

    if (rlsError) {
      console.log('⚠️ 无法查询RLS状态:', rlsError.message)
    } else {
      console.log(`📊 pdfs表RLS状态: ${rlsStatus.relrowsecurity ? '启用' : '禁用'}`)
    }

    // 6. 测试匿名用户权限
    console.log('\n6. 测试匿名用户访问权限...')
    const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTc4OTUsImV4cCI6MjA2NDc3Mzg5NX0.g-xSF9yegK1lp9emJx4YOlJjw4BoAJZ1yz38t-r2mWc')
    
    const { data: anonRead, error: anonReadError } = await anonClient
      .from('pdfs')
      .select('count(*)', { count: 'exact', head: true })

    if (anonReadError) {
      console.error('❌ 匿名用户无法读取pdfs表:', anonReadError.message)
    } else {
      console.log('✅ 匿名用户可以读取pdfs表')
    }

    const testAnonPdfId = 'test-anon-pdf-' + Date.now()
    const { data: anonCreate, error: anonCreateError } = await anonClient
      .from('pdfs')
      .insert({
        id: testAnonPdfId,
        name: 'Test Anon PDF',
        url: 'temp://anon-test',
        size: 0,
        user_id: null
      })
      .select()
      .single()

    if (anonCreateError) {
      console.error('❌ 匿名用户无法创建PDF记录:', anonCreateError.message)
    } else {
      console.log('✅ 匿名用户可以创建PDF记录')
      // 清理
      await anonClient.from('pdfs').delete().eq('id', testAnonPdfId)
    }

  } catch (error) {
    console.error('💥 诊断过程中发生错误:', error)
  }
}

diagnosePermissions().then(() => {
  console.log('\n🎯 诊断完成')
  process.exit(0)
}).catch(error => {
  console.error('💥 诊断失败:', error)
  process.exit(1)
})