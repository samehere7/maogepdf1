// 使用内置的fetch API (Node.js 18+)

const supabaseUrl = 'https://pwlvfmywfzllopuiisxg.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.CkPzDehpjCsiH7ZpLPtu8LUZzr5q1w4iTHp-Z_bobLk'

async function testDirectAPI() {
  console.log('直接测试Supabase REST API...\n')

  try {
    // 1. 测试基本连接 - 获取pdfs表数据
    console.log('1. 测试GET请求到pdfs表...')
    const getResponse = await fetch(`${supabaseUrl}/rest/v1/pdfs?select=id,name&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('GET响应状态:', getResponse.status)
    const getData = await getResponse.text()
    console.log('GET响应内容:', getData)

    if (!getResponse.ok) {
      console.error('GET请求失败')
      return
    }

    // 2. 测试POST请求 - 创建记录
    console.log('\n2. 测试POST请求创建记录...')
    const testId = 'test-direct-' + Date.now()
    const postResponse = await fetch(`${supabaseUrl}/rest/v1/pdfs`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: testId,
        name: 'Direct API Test',
        url: 'temp://direct-test',
        size: 100,
        user_id: null
      })
    })

    console.log('POST响应状态:', postResponse.status)
    const postData = await postResponse.text()
    console.log('POST响应内容:', postData)

    if (postResponse.ok) {
      console.log('✅ 创建记录成功！')
      
      // 清理测试记录
      const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/pdfs?id=eq.${testId}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (deleteResponse.ok) {
        console.log('🧹 测试记录已清理')
      }
    } else {
      console.error('❌ 创建记录失败')
    }

  } catch (error) {
    console.error('请求过程中发生错误:', error)
  }
}

testDirectAPI()