#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// 从.env.local文件获取配置
const supabaseUrl = 'https://pwlvfmywfzllopuiisxg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.vUpXVr8l0-y5qTKGROKy_Tn3z0Z9sQNALkjWcMZuH-c';

console.log('🚀 开始设置Supabase数据库...\n');

async function setupDatabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log('📡 测试基本连接...');
    
    // 简单测试 - 查询一个系统表
    const { data, error } = await supabase
      .from('auth.users')
      .select('count', { count: 'exact', head: true });
      
    if (error) {
      console.log('尝试alternative连接方法...');
      // 尝试查询public schema
      const { data: altData, error: altError } = await supabase
        .rpc('version');
        
      if (altError) {
        console.error('数据库连接失败:', altError.message);
        return false;
      }
    }
    
    console.log('✅ 数据库连接成功\n');

    // 1. 创建Plus状态更新函数
    console.log('📝 创建update_user_plus_status函数...');
    
    const { data: result1, error: error1 } = await supabase.rpc('exec', {
      sql: `
CREATE OR REPLACE FUNCTION update_user_plus_status(
  user_id UUID,
  is_plus BOOLEAN,
  is_active_param BOOLEAN,
  expire_at_param TIMESTAMPTZ,
  plan_param TEXT
) RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  user_exists BOOLEAN;
BEGIN
  -- 检查用户是否存在于auth.users表
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    result := json_build_object(
      'success', false,
      'error', 'User not found',
      'user_id', user_id
    );
    RETURN result;
  END IF;

  -- 更新或插入user_profiles记录
  INSERT INTO public.user_profiles (id, email, plus, is_active, expire_at, updated_at)
  SELECT 
    user_id,
    COALESCE(au.email, 'unknown@example.com'),
    is_plus,
    is_active_param,
    expire_at_param,
    NOW()
  FROM auth.users au WHERE au.id = user_id
  ON CONFLICT (id) 
  DO UPDATE SET 
    plus = EXCLUDED.plus,
    is_active = EXCLUDED.is_active,
    expire_at = EXCLUDED.expire_at,
    updated_at = EXCLUDED.updated_at;

  -- 更新或插入plus记录
  INSERT INTO public.plus (id, is_paid, paid_at, plan, expire_at, pdf_count, chat_count)
  VALUES (user_id, TRUE, NOW(), plan_param, expire_at_param, 0, 0)
  ON CONFLICT (id)
  DO UPDATE SET
    is_paid = TRUE,
    paid_at = NOW(),
    plan = EXCLUDED.plan,
    expire_at = EXCLUDED.expire_at;

  result := json_build_object(
    'success', true,
    'user_id', user_id,
    'plan', plan_param,
    'expire_at', expire_at_param
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', user_id
    );
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
`
    });

    if (error1) {
      console.error('❌ 创建函数失败:', error1.message);
    } else {
      console.log('✅ update_user_plus_status函数创建成功');
    }

    // 2. 创建user_with_plus视图
    console.log('\n📊 创建user_with_plus视图...');
    
    const { data: result2, error: error2 } = await supabase.rpc('exec', {
      sql: `
DROP VIEW IF EXISTS public.user_with_plus;

CREATE VIEW public.user_with_plus AS
SELECT 
  up.id,
  up.email,
  up.name,
  up.avatar_url,
  up.created_at,
  up.updated_at,
  CASE 
    WHEN up.plus = true AND (up.expire_at IS NULL OR up.expire_at > NOW())
    THEN true 
    ELSE false 
  END as plus,
  CASE 
    WHEN up.plus = true 
         AND up.is_active = true 
         AND (up.expire_at IS NULL OR up.expire_at > NOW())
    THEN true 
    ELSE false 
  END as is_active,
  up.expire_at,
  p.plan,
  p.paid_at,
  p.pdf_count,
  p.chat_count,
  CASE 
    WHEN up.expire_at IS NOT NULL AND up.expire_at <= NOW()
    THEN true 
    ELSE false 
  END as is_expired
FROM public.user_profiles up
LEFT JOIN public.plus p ON up.id = p.id;

GRANT SELECT ON public.user_with_plus TO authenticated;
GRANT SELECT ON public.user_with_plus TO anon;
GRANT ALL ON public.user_with_plus TO service_role;
`
    });

    if (error2) {
      console.error('❌ 创建视图失败:', error2.message);
    } else {
      console.log('✅ user_with_plus视图创建成功');
    }

    console.log('\n🎉 数据库设置完成！');
    console.log('\n📋 创建的组件:');
    console.log('  • update_user_plus_status() 函数');
    console.log('  • user_with_plus 视图');
    
    return true;
    
  } catch (error) {
    console.error('❌ 设置过程出错:', error);
    return false;
  }
}

// 执行设置
if (require.main === module) {
  setupDatabase().then(success => {
    if (success) {
      console.log('\n✅ 数据库配置完成，可以继续部署！');
    } else {
      console.log('\n❌ 数据库配置失败，请检查连接设置');
      process.exit(1);
    }
  });
}

module.exports = { setupDatabase };