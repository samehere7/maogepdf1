const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ 缺少环境变量');
  console.error('请确保 .env.local 文件中包含:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 开始修复 user_daily_quota 表的RLS策略...');
console.log('📡 Supabase URL:', supabaseUrl);

// 使用服务角色密钥创建客户端（绕过RLS）
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(query, description) {
  console.log(`🔄 ${description}...`);
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseServiceRoleKey
      },
      body: JSON.stringify({ sql: query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`⚠️  ${description} - 响应状态: ${response.status}`);
      console.log(`⚠️  ${description} - 错误信息: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ ${description} - 成功`);
    return true;
  } catch (error) {
    console.log(`⚠️  ${description} - 异常: ${error.message}`);
    return false;
  }
}

async function fixQuotaRLS() {
  try {
    // 1. 确保表存在
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_daily_quota (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        pdf_count INTEGER DEFAULT 0,
        chat_count INTEGER DEFAULT 0,
        quota_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await executeSQL(createTableSQL, '确保 user_daily_quota 表存在');

    // 2. 启用 RLS
    await executeSQL(
      'ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;',
      '启用 RLS'
    );

    // 3. 删除现有策略
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own quota" ON public.user_daily_quota;',
      'DROP POLICY IF EXISTS "Users can insert their own quota" ON public.user_daily_quota;',
      'DROP POLICY IF EXISTS "Users can update their own quota" ON public.user_daily_quota;',
      'DROP POLICY IF EXISTS "Users can delete their own quota" ON public.user_daily_quota;'
    ];

    for (const policy of dropPolicies) {
      await executeSQL(policy, '删除现有策略');
    }

    // 4. 创建新的策略
    const createPolicies = [
      {
        sql: `CREATE POLICY "Users can view their own quota" ON public.user_daily_quota
              FOR SELECT USING (auth.uid() = id);`,
        desc: '创建查看策略'
      },
      {
        sql: `CREATE POLICY "Users can insert their own quota" ON public.user_daily_quota
              FOR INSERT WITH CHECK (auth.uid() = id);`,
        desc: '创建插入策略'
      },
      {
        sql: `CREATE POLICY "Users can update their own quota" ON public.user_daily_quota
              FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`,
        desc: '创建更新策略'
      },
      {
        sql: `CREATE POLICY "Users can delete their own quota" ON public.user_daily_quota
              FOR DELETE USING (auth.uid() = id);`,
        desc: '创建删除策略'
      }
    ];

    for (const policy of createPolicies) {
      await executeSQL(policy.sql, policy.desc);
    }

    // 5. 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_daily_quota_id ON public.user_daily_quota(id);',
      'CREATE INDEX IF NOT EXISTS idx_user_daily_quota_date ON public.user_daily_quota(quota_date);'
    ];

    for (const index of indexes) {
      await executeSQL(index, '创建索引');
    }

    console.log('\n🎯 开始为现有用户创建配额记录...');

    // 6. 获取所有用户并创建配额记录
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ 获取用户列表失败:', usersError);
      return;
    }

    console.log(`👥 找到 ${users.users.length} 个用户`);

    const today = new Date().toISOString().slice(0, 10);

    for (const user of users.users) {
      try {
        // 使用 upsert 确保不会重复插入
        const { error } = await supabase
          .from('user_daily_quota')
          .upsert({
            id: user.id,
            pdf_count: 0,
            chat_count: 0,
            quota_date: today,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.log(`⚠️  用户 ${user.email} 配额记录创建失败: ${error.message}`);
        } else {
          console.log(`✅ 用户 ${user.email} 配额记录已创建/更新`);
        }
      } catch (error) {
        console.log(`⚠️  用户 ${user.email} 处理异常: ${error.message}`);
      }
    }

    console.log('\n🎉 修复完成！');
    console.log('📊 现在用户应该可以正常访问配额信息了');

  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  }
}

// 运行修复
fixQuotaRLS().then(() => {
  console.log('✨ 修复脚本执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 修复脚本执行失败:', error);
  process.exit(1);
});