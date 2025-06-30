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

async function createQuotaRecords() {
  console.log('开始为用户创建配额记录...');

  try {
    // 获取所有用户
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('获取用户列表失败:', usersError);
      return;
    }

    console.log(`找到 ${users.users.length} 个用户`);

    // 使用服务角色直接插入记录
    for (const user of users.users) {
      const today = new Date().toISOString().slice(0, 10);
      
      // 先检查记录是否存在
      const { data: existing } = await supabase
        .from('user_daily_quota')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existing) {
        // 如果不存在，创建新记录
        const { error: insertError } = await supabase
          .from('user_daily_quota')
          .insert({
            id: user.id,
            pdf_count: 0,
            chat_count: 0,
            quota_date: today
          });

        if (insertError) {
          console.warn(`为用户 ${user.email} 创建配额记录失败:`, insertError.message);
        } else {
          console.log(`✓ 为用户 ${user.email} 创建了配额记录`);
        }
      } else {
        console.log(`用户 ${user.email} 的配额记录已存在`);
      }
    }

    console.log('✅ 配额记录创建完成');

  } catch (error) {
    console.error('创建配额记录时出现错误:', error);
  }
}

// 运行创建
createQuotaRecords().then(() => {
  console.log('脚本执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});