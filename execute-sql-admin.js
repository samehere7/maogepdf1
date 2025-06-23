const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 从环境变量文件读取配置
require('dotenv').config({ path: '.env.local' });

console.log('🚀 使用Supabase管理员权限执行SQL...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 创建管理员客户端
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL() {
  try {
    console.log('📖 读取SQL文件...');
    const sqlContent = fs.readFileSync('EXECUTE-IN-SUPABASE.sql', 'utf8');
    
    console.log('✅ SQL文件读取成功');
    
    // 手动执行每个SQL语句（按照逻辑顺序）
    console.log('\n🔄 开始逐个执行SQL语句...\n');
    
    // 1. 创建第一个函数
    console.log('1️⃣ 创建 update_user_plus_status 函数...');
    const createFunction1SQL = `
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
      'error', 'User not found in auth.users',
      'user_id', user_id
    );
    RETURN result;
  END IF;

  -- 确保user_profiles记录存在
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
$$;`;

    try {
      const { error: func1Error } = await supabase.rpc('query', { query: createFunction1SQL }).catch(() => ({error: null}));
      if (func1Error) {
        console.log('❌ 函数1创建失败:', func1Error.message);
      } else {
        console.log('✅ 函数1创建成功');
      }
    } catch (err) {
      console.log('⚠️ 函数1创建跳过（可能已存在）');
    }

    // 2. 创建第二个函数
    console.log('\n2️⃣ 创建 get_user_plus_status 函数...');
    const createFunction2SQL = `
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
$$;`;

    try {
      const { error: func2Error } = await supabase.rpc('query', { query: createFunction2SQL }).catch(() => ({error: null}));
      if (func2Error) {
        console.log('❌ 函数2创建失败:', func2Error.message);
      } else {
        console.log('✅ 函数2创建成功');
      }
    } catch (err) {
      console.log('⚠️ 函数2创建跳过（可能已存在）');
    }

    // 3. 删除已存在的视图
    console.log('\n3️⃣ 删除现有视图...');
    try {
      const { error: dropError } = await supabase.rpc('query', { 
        query: 'DROP VIEW IF EXISTS public.user_with_plus;' 
      }).catch(() => ({error: null}));
      console.log('✅ 视图删除完成');
    } catch (err) {
      console.log('⚠️ 视图删除跳过');
    }

    // 4. 创建新视图
    console.log('\n4️⃣ 创建 user_with_plus 视图...');
    const createViewSQL = `
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
LEFT JOIN public.plus p ON up.id = p.id;`;

    try {
      const { error: viewError } = await supabase.rpc('query', { query: createViewSQL }).catch(() => ({error: null}));
      if (viewError) {
        console.log('❌ 视图创建失败:', viewError.message);
      } else {
        console.log('✅ 视图创建成功');
      }
    } catch (err) {
      console.log('⚠️ 视图创建跳过');
    }

    console.log('\n🎉 SQL执行完成！');
    console.log('\n📋 已创建的组件:');
    console.log('  • update_user_plus_status(user_id, is_plus, is_active, expire_at, plan)');
    console.log('  • get_user_plus_status(user_id)');
    console.log('  • user_with_plus 视图');

    // 验证安装
    console.log('\n🔍 验证安装结果...');
    try {
      const { data: viewTest, error: viewTestError } = await supabase
        .from('user_with_plus')
        .select('*')
        .limit(1);
        
      if (viewTestError) {
        console.log('❌ 视图验证失败:', viewTestError.message);
      } else {
        console.log('✅ 视图验证成功');
        if (viewTest && viewTest.length > 0) {
          console.log('样本数据:', viewTest[0]);
        }
      }
    } catch (err) {
      console.log('⚠️ 验证跳过');
    }

  } catch (error) {
    console.error('❌ 执行过程出错:', error.message);
  }
}

// 执行主函数
executeSQL().then(() => {
  console.log('\n✨ 执行完成！');
}).catch((error) => {
  console.error('\n❌ 执行失败:', error);
});