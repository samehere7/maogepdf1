const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

// 使用服务角色密钥创建客户端（绕过RLS）
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixQuotaRLS() {
  console.log('开始修复 user_daily_quota 表的 RLS 策略...');

  try {
    // 1. 启用 RLS
    console.log('1. 启用 RLS...');
    const { error: enableRlsError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;'
    });
    if (enableRlsError && !enableRlsError.message.includes('already enabled')) {
      console.error('启用 RLS 失败:', enableRlsError);
    } else {
      console.log('✓ RLS 已启用');
    }

    // 2. 删除现有策略
    console.log('2. 删除现有策略...');
    const policies = [
      'DROP POLICY IF EXISTS "Users can view their own quota" ON public.user_daily_quota;',
      'DROP POLICY IF EXISTS "Users can insert their own quota" ON public.user_daily_quota;',
      'DROP POLICY IF EXISTS "Users can update their own quota" ON public.user_daily_quota;'
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('sql', { query: policy });
      if (error) {
        console.warn('删除策略时出现警告:', error.message);
      }
    }
    console.log('✓ 现有策略已删除');

    // 3. 创建新的策略
    console.log('3. 创建新的 RLS 策略...');
    const newPolicies = [
      `CREATE POLICY "Users can view their own quota" ON public.user_daily_quota
       FOR SELECT USING (auth.uid() = id);`,
      `CREATE POLICY "Users can insert their own quota" ON public.user_daily_quota
       FOR INSERT WITH CHECK (auth.uid() = id);`,
      `CREATE POLICY "Users can update their own quota" ON public.user_daily_quota
       FOR UPDATE USING (auth.uid() = id);`
    ];

    for (const policy of newPolicies) {
      const { error } = await supabase.rpc('sql', { query: policy });
      if (error) {
        console.error('创建策略失败:', error);
      } else {
        console.log('✓ 策略创建成功');
      }
    }

    // 4. 创建索引
    console.log('4. 创建索引...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_daily_quota_id ON public.user_daily_quota(id);',
      'CREATE INDEX IF NOT EXISTS idx_user_daily_quota_date ON public.user_daily_quota(quota_date);'
    ];

    for (const index of indexes) {
      const { error } = await supabase.rpc('sql', { query: index });
      if (error) {
        console.warn('创建索引时出现警告:', error.message);
      }
    }
    console.log('✓ 索引已创建');

    // 5. 为现有用户创建配额记录
    console.log('5. 为现有用户创建配额记录...');
    
    // 首先获取所有用户
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('获取用户列表失败:', usersError);
      return;
    }

    console.log(`找到 ${users.users.length} 个用户`);

    // 为每个用户创建配额记录
    for (const user of users.users) {
      const { error: upsertError } = await supabase
        .from('user_daily_quota')
        .upsert({
          id: user.id,
          pdf_count: 0,
          chat_count: 0,
          quota_date: new Date().toISOString().slice(0, 10)
        }, { onConflict: 'id' });

      if (upsertError) {
        console.warn(`为用户 ${user.email} 创建配额记录失败:`, upsertError.message);
      } else {
        console.log(`✓ 为用户 ${user.email} 创建了配额记录`);
      }
    }

    console.log('✅ user_daily_quota 表的 RLS 策略修复完成');

  } catch (error) {
    console.error('修复过程中出现错误:', error);
  }
}

// 运行修复
fixQuotaRLS().then(() => {
  console.log('修复脚本执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('修复脚本执行失败:', error);
  process.exit(1);
});