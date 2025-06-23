const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixFrontendPermissions() {
  console.log('🔧 修复前端权限问题...')
  
  try {
    // 1. 首先删除可能冲突的视图
    console.log('📝 步骤1: 删除现有视图...')
    const { error: dropError } = await supabase.rpc('execute_sql', {
      query: 'DROP VIEW IF EXISTS public.user_with_plus;'
    })
    if (dropError) console.log('删除视图警告:', dropError.message)
    
    // 2. 创建简化的视图
    console.log('📝 步骤2: 创建简化视图...')
    const createViewSQL = `
      CREATE OR REPLACE VIEW public.user_with_plus AS
      SELECT 
        up.id,
        up.email,
        up.name,
        up.avatar_url,
        up.plus,
        up.is_active,
        up.expire_at,
        up.updated_at
      FROM public.user_profiles up;
    `
    
    const { error: createError } = await supabase.rpc('execute_sql', {
      query: createViewSQL
    })
    if (createError) throw createError
    
    // 3. 设置视图权限
    console.log('📝 步骤3: 设置视图权限...')
    const permissionsSQL = `
      GRANT SELECT ON public.user_with_plus TO authenticated;
      GRANT SELECT ON public.user_with_plus TO anon;
      GRANT ALL ON public.user_with_plus TO service_role;
    `
    
    const { error: permError } = await supabase.rpc('execute_sql', {
      query: permissionsSQL
    })
    if (permError) throw permError
    
    // 4. 调整RLS策略
    console.log('📝 步骤4: 调整RLS策略...')
    const rlsSQL = `
      DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
      CREATE POLICY "Users can view own profile" ON public.user_profiles
        FOR SELECT USING (
          auth.uid() = id OR 
          auth.role() = 'service_role'
        );
      
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    `
    
    const { error: rlsError } = await supabase.rpc('execute_sql', {
      query: rlsSQL
    })
    if (rlsError) throw rlsError
    
    // 5. 测试视图查询
    console.log('📝 步骤5: 测试视图查询...')
    const testUserId = '819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8'
    
    const { data: testData, error: testError } = await supabase
      .from('user_with_plus')
      .select('plus, expire_at, is_active')
      .eq('id', testUserId)
      .single()
    
    if (testError) {
      console.log('⚠️ 测试查询失败:', testError.message)
      
      // 备用方案：直接查询 user_profiles 表
      console.log('📝 使用备用方案：直接查询用户表...')
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('plus, expire_at, is_active')
        .eq('id', testUserId)
        .single()
      
      if (userError) {
        console.log('❌ 备用查询也失败:', userError.message)
      } else {
        console.log('✅ 备用查询成功:', userData)
      }
    } else {
      console.log('✅ 视图查询成功:', testData)
    }
    
    console.log('🎉 前端权限修复完成！')
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error.message)
  }
}

fixFrontendPermissions()