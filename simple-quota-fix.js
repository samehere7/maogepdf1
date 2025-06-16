const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

// 使用服务角色密钥创建客户端（绕过RLS）
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function simpleQuotaFix() {
  console.log('🔧 开始简单的配额修复...');

  try {
    // 1. 先检查表是否存在
    console.log('🔍 检查 user_daily_quota 表结构...');
    const { data: existingData, error: checkError } = await supabase
      .from('user_daily_quota')
      .select('*')
      .limit(1);

    if (checkError) {
      console.log('❌ 表访问错误:', checkError.message);
      console.log('🔧 尝试直接为用户创建简化配额记录...');
    } else {
      console.log('✅ 表存在，数据示例:', existingData);
    }

    // 2. 获取所有用户
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ 获取用户列表失败:', usersError);
      return;
    }

    console.log(`👥 找到 ${users.users.length} 个用户`);

    const today = new Date().toISOString().slice(0, 10);

    // 3. 为每个用户创建配额记录（仅使用必需字段）
    for (const user of users.users) {
      try {
        console.log(`🔄 处理用户: ${user.email}`);
        
        // 尝试使用最简单的字段结构
        const { error } = await supabase
          .from('user_daily_quota')
          .upsert({
            id: user.id,
            pdf_count: 0,
            chat_count: 0,
            quota_date: today
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.log(`⚠️  用户 ${user.email} 配额记录创建失败: ${error.message}`);
          
          // 如果upsert失败，尝试简单的insert
          const { error: insertError } = await supabase
            .from('user_daily_quota')
            .insert({
              id: user.id,
              pdf_count: 0,
              chat_count: 0,
              quota_date: today
            });
            
          if (insertError) {
            console.log(`⚠️  用户 ${user.email} 插入也失败: ${insertError.message}`);
          } else {
            console.log(`✅ 用户 ${user.email} 通过insert创建配额记录成功`);
          }
        } else {
          console.log(`✅ 用户 ${user.email} 配额记录已创建/更新`);
        }
      } catch (error) {
        console.log(`⚠️  用户 ${user.email} 处理异常: ${error.message}`);
      }
    }

    // 4. 测试访问
    console.log('\n🧪 测试配额访问...');
    const firstUser = users.users[0];
    if (firstUser) {
      const { data: testData, error: testError } = await supabase
        .from('user_daily_quota')
        .select('*')
        .eq('id', firstUser.id)
        .single();

      if (testError) {
        console.log('❌ 测试访问失败:', testError.message);
      } else {
        console.log('✅ 测试访问成功:', testData);
      }
    }

    console.log('\n🎉 简单修复完成！');

  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  }
}

// 运行修复
simpleQuotaFix().then(() => {
  console.log('✨ 修复脚本执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 修复脚本执行失败:', error);
  process.exit(1);
});