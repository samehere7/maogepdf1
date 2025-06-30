-- =================================================
-- 第四部分：验证安装
-- =================================================

DO $block$
DECLARE
  function_count INTEGER;
  view_exists BOOLEAN;
BEGIN
  -- 检查函数是否创建成功
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
    AND routine_name IN ('update_user_plus_status', 'get_user_plus_status');
  
  -- 检查视图是否创建成功
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'user_with_plus'
  ) INTO view_exists;
  
  -- 输出结果
  RAISE NOTICE '=== 安装验证结果 ===';
  RAISE NOTICE '函数创建数量: %/2', function_count;
  RAISE NOTICE '视图创建状态: %', CASE WHEN view_exists THEN '成功' ELSE '失败' END;
  
  IF function_count = 2 AND view_exists THEN
    RAISE NOTICE '✅ 所有组件安装成功！';
    RAISE NOTICE '📋 已创建:';
    RAISE NOTICE '  • update_user_plus_status() 函数';
    RAISE NOTICE '  • get_user_plus_status() 函数';
    RAISE NOTICE '  • user_with_plus 视图';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 支付系统数据库配置完成！';
  ELSE
    RAISE NOTICE '❌ 部分组件安装失败，请检查错误信息';
  END IF;
END;
$block$;