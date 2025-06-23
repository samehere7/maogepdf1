#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// 从环境变量加载配置
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量：NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 创建管理员客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 完整的SQL脚本
const sqlScript = `
-- 统一的RLS策略修复脚本 - 一次性解决所有权限问题

-- 1. 启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有旧策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can update own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can insert own plus status" ON public.plus;
DROP POLICY IF EXISTS "Service role full access to plus" ON public.plus;

DROP POLICY IF EXISTS "Users can view own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Service role full access to user_daily_quota" ON public.user_daily_quota;

-- 3. 创建新的统一策略
-- user_profiles 表
CREATE POLICY "user_profiles_owner_policy" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "user_profiles_service_role_policy" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- plus 表
CREATE POLICY "plus_owner_policy" ON public.plus
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "plus_service_role_policy" ON public.plus
  FOR ALL USING (auth.role() = 'service_role');

-- user_daily_quota 表
CREATE POLICY "quota_owner_policy" ON public.user_daily_quota
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "quota_service_role_policy" ON public.user_daily_quota
  FOR ALL USING (auth.role() = 'service_role');

-- 4. 创建Plus状态更新函数
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
BEGIN
  -- 更新或插入user_profiles记录
  INSERT INTO public.user_profiles (id, plus, is_active, expire_at, updated_at)
  VALUES (user_id, is_plus, is_active_param, expire_at_param, NOW())
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
    is_paid = EXCLUDED.is_paid,
    paid_at = EXCLUDED.paid_at,
    plan = EXCLUDED.plan,
    expire_at = EXCLUDED.expire_at;

  -- 返回成功结果
  result := json_build_object(
    'success', true,
    'user_id', user_id,
    'plan', plan_param,
    'expire_at', expire_at_param
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- 返回错误信息
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', user_id
    );
    RETURN result;
END;
$$;

-- 5. 授予函数执行权限
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO authenticated;

-- 6. 验证设置
SELECT 'RLS policies and functions created successfully' as status;
`;

async function executeSQL() {
  console.log('🚀 开始执行RLS策略修复脚本...');
  
  // 直接执行逐条SQL语句
  await executeStepByStep();
}

async function executeStepByStep() {
  console.log('⚠️  注意：由于Supabase JavaScript客户端限制，我们无法直接执行DDL语句。');
  console.log('📝 请手动在Supabase SQL编辑器中执行以下SQL脚本：');
  console.log('='.repeat(80));
  console.log(`
-- 统一的RLS策略修复脚本 - 一次性解决所有权限问题

-- 1. 启用RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有旧策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access to user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can update own plus status" ON public.plus;
DROP POLICY IF EXISTS "Users can insert own plus status" ON public.plus;
DROP POLICY IF EXISTS "Service role full access to plus" ON public.plus;

DROP POLICY IF EXISTS "Users can view own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can update own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Users can insert own quota" ON public.user_daily_quota;
DROP POLICY IF EXISTS "Service role full access to user_daily_quota" ON public.user_daily_quota;

-- 3. 创建新的统一策略
-- user_profiles 表
CREATE POLICY "user_profiles_owner_policy" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "user_profiles_service_role_policy" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- plus 表
CREATE POLICY "plus_owner_policy" ON public.plus
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "plus_service_role_policy" ON public.plus
  FOR ALL USING (auth.role() = 'service_role');

-- user_daily_quota 表
CREATE POLICY "quota_owner_policy" ON public.user_daily_quota
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "quota_service_role_policy" ON public.user_daily_quota
  FOR ALL USING (auth.role() = 'service_role');

-- 4. 创建Plus状态更新函数
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
BEGIN
  -- 更新或插入user_profiles记录
  INSERT INTO public.user_profiles (id, plus, is_active, expire_at, updated_at)
  VALUES (user_id, is_plus, is_active_param, expire_at_param, NOW())
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
    is_paid = EXCLUDED.is_paid,
    paid_at = EXCLUDED.paid_at,
    plan = EXCLUDED.plan,
    expire_at = EXCLUDED.expire_at;

  -- 返回成功结果
  result := json_build_object(
    'success', true,
    'user_id', user_id,
    'plan', plan_param,
    'expire_at', expire_at_param
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- 返回错误信息
    result := json_build_object(
      'success', false,
      'error', SQLERRM,
      'user_id', user_id
    );
    RETURN result;
END;
$$;

-- 5. 授予函数执行权限
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_user_plus_status(UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TEXT) TO authenticated;

-- 6. 验证设置
SELECT 'RLS policies and functions created successfully' as status;
  `);
  console.log('='.repeat(80));
  
  // 尝试验证连接
  try {
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('❌ 数据库连接验证失败:', error.message);
    } else {
      console.log('✅ 数据库连接正常，可以进行手动SQL执行');
      console.log(`📊 user_profiles表记录数: ${data?.length || 0}`);
    }
  } catch (err) {
    console.log('❌ 数据库连接异常:', err.message);
  }
  
  console.log('\n🔗 Supabase项目链接: https://supabase.com/dashboard/project/pwlvfmywfzllopuiisxg');
  console.log('📝 请在 SQL Editor 中执行上述脚本');
}

// 执行脚本
executeSQL().catch(console.error);