const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pwlvfmywfzllopuiisxg.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.CkPzDehpjCsiH7ZpLPtu8LUZzr5q1w4iTHp-Z_bobLk'

console.log('测试Supabase连接...')
console.log('URL:', supabaseUrl)
console.log('Service Key (前20字符):', supabaseServiceKey.substring(0, 20) + '...')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function test() {
  try {
    console.log('\n1. 测试基本查询...')
    const { data, error } = await supabase
      .from('pdfs')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.error('查询错误:', error)
      console.error('错误代码:', error.code)
      console.error('错误详情:', error.details)
      console.error('错误提示:', error.hint)
      console.error('错误消息:', error.message)
    } else {
      console.log('查询成功:', data)
    }

    console.log('\n2. 测试创建记录...')
    const testId = 'test-' + Date.now()
    const { data: insertData, error: insertError } = await supabase
      .from('pdfs')
      .insert({
        id: testId,
        name: 'Test Document',
        url: 'temp://test',
        size: 100,
        user_id: null
      })
      .select()

    if (insertError) {
      console.error('插入错误:', insertError)
    } else {
      console.log('插入成功:', insertData)
      
      // 清理
      await supabase.from('pdfs').delete().eq('id', testId)
      console.log('已清理测试数据')
    }

  } catch (err) {
    console.error('脚本错误:', err)
  }
}

test()