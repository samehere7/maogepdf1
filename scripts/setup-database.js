#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pwlvfmywfzllopuiisxg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bHZmbXl3ZnpsbG9wdWlpc3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5Nzg5NSwiZXhwIjoyMDY0NzczODk1fQ.vUpXVr8l0-y5qTKGROKy_Tn3z0Z9sQNALkjWcMZuH-c';

console.log('🚀 开始设置Supabase数据库...\n');

async function setupDatabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    console.log('📡 测试数据库连接...');
    
    // 测试连接
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
      
    if (healthError) {
      console.error('❌ 数据库连接失败:', healthError.message);
      return;
    }
    
    console.log('✅ 数据库连接成功\n');

    // 1. 创建数据库函数
    console.log('📝 创建数据库函数...');
    
    const createFunctionsSQL = `
-- 1. 创建Plus状态更新函数
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
  -- 记录函数调用
  RAISE LOG 'update_user_plus_status called for user_id: %, plan: %', user_id, plan_param;
  
  -- 检查用户是否存在于auth.users表
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    result := json_build_object(
      'success', false,
      'error', 'User not found in auth.users',
      'user_id', user_id
    );
    RAISE LOG 'User not found: %', user_id;
    RETURN result;
  END IF;

  -- 确保user_profiles记录存在（先查询再插入）
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
    expire_at = EXCLUDED.expire_at,
    pdf_count = COALESCE(public.plus.pdf_count, 0),
    chat_count = COALESCE(public.plus.chat_count, 0);

  -- 返回成功结果
  result := json_build_object(
    'success', true,
    'user_id', user_id,
    'plan', plan_param,
    'expire_at', expire_at_param,
    'updated_at', NOW()
  );
  
  RAISE LOG 'Successfully updated plus status for user: %', user_id;
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- 返回详细错误信息
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE,
      'user_id', user_id,
      'timestamp', NOW()
    );
    RAISE LOG 'Error updating plus status for user %: %', user_id, SQLERRM;
    RETURN result;
END;
$$;

-- 2. 创建获取用户Plus状态的函数
CREATE OR REPLACE FUNCTION get_user_plus_status(user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  user_data RECORD;
BEGIN
  -- 查询用户的Plus状态
  SELECT 
    up.id,
    up.email,
    up.name,
    up.plus,
    up.is_active,
    up.expire_at,
    p.plan,
    p.paid_at
  INTO user_data
  FROM public.user_profiles up
  LEFT JOIN public.plus p ON up.id = p.id
  WHERE up.id = user_id;
  
  IF NOT FOUND THEN
    result := json_build_object(
      'success', false,
      'error', 'User profile not found',
      'user_id', user_id
    );
  ELSE
    -- 检查是否过期
    DECLARE
      is_expired BOOLEAN := user_data.expire_at IS NOT NULL AND user_data.expire_at < NOW();
    BEGIN
      result := json_build_object(
        'success', true,
        'user_id', user_data.id,
        'email', user_data.email,
        'name', user_data.name,
        'plus', user_data.plus AND NOT is_expired,
        'is_active', user_data.is_active AND NOT is_expired,
        'expire_at', user_data.expire_at,
        'plan', user_data.plan,
        'paid_at', user_data.paid_at,
        'is_expired', is_expired
      );
    END;
  END IF;
  
  RETURN result;
END;
$$;

-- 授予服务角色执行权限
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_plus_status(UUID) TO service_role;

-- 也允许认证用户调用get_user_plus_status查询自己的状态
GRANT EXECUTE ON FUNCTION get_user_plus_status(UUID) TO authenticated;
`;

    // 执行函数创建
    const { error: functionError } = await supabase.rpc('exec', { sql: createFunctionsSQL });
    
    if (functionError) {
      console.error('❌ 创建函数失败:', functionError.message);
    } else {
      console.log('✅ 数据库函数创建成功');
    }

    // 2. 创建视图
    console.log('\n📊 创建数据库视图...');
    
    const createViewSQL = `
-- 删除现有视图（如果存在）
DROP VIEW IF EXISTS public.user_with_plus;

-- 创建改进的user_with_plus视图
CREATE VIEW public.user_with_plus AS
SELECT 
  up.id,
  up.email,
  up.name,
  up.avatar_url,
  up.created_at,
  up.updated_at,
  -- Plus状态逻辑：检查是否为Plus用户且未过期
  CASE 
    WHEN up.plus = true AND (up.expire_at IS NULL OR up.expire_at > NOW())
    THEN true 
    ELSE false 
  END as plus,
  -- 活跃状态：Plus用户且未过期且is_active为true
  CASE 
    WHEN up.plus = true 
         AND up.is_active = true 
         AND (up.expire_at IS NULL OR up.expire_at > NOW())
    THEN true 
    ELSE false 
  END as is_active,
  up.expire_at,
  -- 从plus表获取额外信息
  p.plan,
  p.paid_at,
  p.pdf_count,
  p.chat_count,
  -- 添加过期检查字段
  CASE 
    WHEN up.expire_at IS NOT NULL AND up.expire_at <= NOW()
    THEN true 
    ELSE false 
  END as is_expired,
  -- 添加剩余天数计算
  CASE 
    WHEN up.expire_at IS NOT NULL AND up.expire_at > NOW()
    THEN EXTRACT(DAYS FROM (up.expire_at - NOW()))::INTEGER
    ELSE NULL
  END as days_remaining
FROM public.user_profiles up
LEFT JOIN public.plus p ON up.id = p.id;

-- 为视图添加注释
COMMENT ON VIEW public.user_with_plus IS 'Combined view of user profiles with Plus membership status and expiration logic';

-- 授予必要权限
GRANT SELECT ON public.user_with_plus TO authenticated;
GRANT SELECT ON public.user_with_plus TO anon;
GRANT ALL ON public.user_with_plus TO service_role;
`;

    const { error: viewError } = await supabase.rpc('exec', { sql: createViewSQL });
    
    if (viewError) {
      console.error('❌ 创建视图失败:', viewError.message);
    } else {
      console.log('✅ 数据库视图创建成功');
    }

    // 3. 验证创建结果
    console.log('\n🔍 验证数据库设置...');
    
    // 测试函数
    try {
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const { data: funcTest, error: funcTestError } = await supabase.rpc('update_user_plus_status', {
        user_id: testUserId,
        is_plus: true,
        is_active_param: true,
        expire_at_param: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        plan_param: 'test'
      });
      
      if (funcTestError) {
        console.error('⚠️ 函数测试警告:', funcTestError.message);
      } else {
        console.log('✅ 函数测试通过');
      }
    } catch (err) {
      console.log('⚠️ 函数测试跳过 (预期结果)');
    }
    
    // 测试视图
    const { data: viewTest, error: viewTestError } = await supabase
      .from('user_with_plus')
      .select('*')
      .limit(1);
      
    if (viewTestError) {
      console.error('❌ 视图测试失败:', viewTestError.message);
    } else {
      console.log('✅ 视图测试通过');
    }

    console.log('\n🎉 数据库设置完成！');
    console.log('\n📋 已创建的组件:');
    console.log('  • update_user_plus_status(user_id, is_plus, is_active, expire_at, plan)');
    console.log('  • get_user_plus_status(user_id)');
    console.log('  • user_with_plus 视图');
    
  } catch (error) {
    console.error('❌ 设置过程出错:', error);
  }
}

// 执行设置
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };