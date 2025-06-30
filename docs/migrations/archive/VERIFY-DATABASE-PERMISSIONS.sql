-- 验证数据库函数权限配置
-- 在Supabase SQL编辑器中运行此脚本

-- 1. 检查函数是否存在
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('update_user_plus_status', 'get_user_plus_status')
ORDER BY p.proname;

-- 2. 检查函数权限
SELECT 
  p.proname as function_name,
  r.rolname as role_name,
  a.privilege_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN information_schema.routine_privileges a ON a.routine_name = p.proname
JOIN pg_roles r ON r.rolname = a.grantee
WHERE n.nspname = 'public' 
  AND p.proname IN ('update_user_plus_status', 'get_user_plus_status')
ORDER BY p.proname, r.rolname;

-- 3. 测试函数调用权限（使用虚拟数据）
-- 注意：这个测试会创建一个测试记录，请在生产环境中谨慎使用

-- 测试用户ID（使用一个不存在的UUID）
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
  test_result JSON;
BEGIN
  -- 测试update_user_plus_status函数
  BEGIN
    SELECT update_user_plus_status(
      test_user_id,
      true,
      true,
      NOW() + INTERVAL '1 year',
      'yearly'
    ) INTO test_result;
    
    RAISE NOTICE 'update_user_plus_status test result: %', test_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'update_user_plus_status test failed: %', SQLERRM;
  END;
  
  -- 测试get_user_plus_status函数
  BEGIN
    SELECT get_user_plus_status(test_user_id) INTO test_result;
    RAISE NOTICE 'get_user_plus_status test result: %', test_result;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'get_user_plus_status test failed: %', SQLERRM;
  END;
  
  -- 清理测试数据
  DELETE FROM public.user_profiles WHERE id = test_user_id;
  DELETE FROM public.plus WHERE id = test_user_id;
END;
$$;

-- 4. 检查RLS策略
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'plus')
ORDER BY tablename, policyname;

-- 5. 验证service_role权限
SELECT 
  r.rolname,
  r.rolsuper,
  r.rolcreaterole,
  r.rolcreatedb,
  r.rolcanlogin,
  r.rolbypassrls
FROM pg_roles r 
WHERE r.rolname = 'service_role';

RAISE NOTICE 'Database permissions verification completed!';