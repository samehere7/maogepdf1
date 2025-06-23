const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAndFixPermissions() {
  console.log('🔍 检查权限问题...')
  
  const testUserId = '819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8'
  
  try {
    // 1. 先测试直接查询 user_profiles 表
    console.log('📝 测试查询 user_profiles 表...')
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, plus, expire_at, is_active')
      .eq('id', testUserId)
      .single()
    
    if (profileError) {
      console.log('❌ user_profiles 查询失败:', profileError.message)
      
      // 如果 user_profiles 查询失败，说明用户数据有问题
      console.log('📝 尝试创建用户profile...')
      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .upsert({
          id: testUserId,
          plus: true,
          is_active: true,
          expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (insertError) {
        console.log('❌ 创建用户profile失败:', insertError.message)
      } else {
        console.log('✅ 用户profile创建成功:', insertData)
      }
    } else {
      console.log('✅ user_profiles 查询成功:', profileData)
    }
    
    // 2. 测试 user_with_plus 视图
    console.log('📝 测试查询 user_with_plus 视图...')
    const { data: viewData, error: viewError } = await supabase
      .from('user_with_plus')
      .select('plus, expire_at, is_active')
      .eq('id', testUserId)
      .single()
    
    if (viewError) {
      console.log('❌ user_with_plus 视图查询失败:', viewError.message)
      console.log('原因: 可能是RLS策略阻止了查询')
    } else {
      console.log('✅ user_with_plus 视图查询成功:', viewData)
    }
    
    // 3. 提供临时解决方案
    console.log('\n🔧 提供临时解决方案建议:')
    console.log('1. 修改前端代码，不使用 user_with_plus 视图，直接查询 user_profiles 表')
    console.log('2. 或者在支付成功后，直接在前端设置用户Plus状态，无需重新查询数据库')
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error.message)
  }
}

checkAndFixPermissions()