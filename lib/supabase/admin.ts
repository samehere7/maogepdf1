import { createClient } from '@supabase/supabase-js';

// 创建具有管理员权限的Supabase客户端
// 注意：这个客户端只能在服务器端使用，不能暴露给客户端
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('缺少Supabase管理员配置环境变量');
    throw new Error('Supabase管理员配置错误');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} 