const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey);
  process.exit(1);
}

console.log('🔍 使用服务角色密钥检查数据库状态...');
console.log('Supabase URL:', supabaseUrl);

// 使用服务角色密钥创建客户端
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabaseStatus() {
  try {
    // 1. 检查表是否存在和RLS状态
    console.log('\n📋 检查表结构和RLS状态:');
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .in('table_name', ['user_profiles', 'plus', 'user_daily_quota', 'pdfs', 'chat_messages'])
        .eq('table_schema', 'public');

      if (tablesError) {
        console.log('⚠️ 表查询出错:', tablesError.message);
      } else if (tables) {
        console.log('✅ 找到以下表:', tables.map(t => `${t.table_schema}.${t.table_name}`).join(', '));
      }
    } catch (error) {
      console.log('⚠️ 无法查询表信息:', error.message);
    }

    // 2. 检查user_profiles表
    console.log('\n🔍 检查user_profiles表:');
    try {
      const { data: profiles, error: profilesError, count } = await supabase
        .from('user_profiles')
        .select('id, email, name, plus', { count: 'exact' });

      if (profilesError) {
        console.log('❌ user_profiles表访问失败:', profilesError.message);
        console.log('错误详情:', profilesError);
      } else {
        console.log(`✅ user_profiles表访问成功，共有 ${count || 0} 条记录`);
        if (profiles && profiles.length > 0) {
          console.log('样本数据:', profiles.slice(0, 2));
        }
      }
    } catch (error) {
      console.log('❌ user_profiles表查询异常:', error.message);
    }

    // 3. 检查plus表
    console.log('\n🔍 检查plus表:');
    try {
      const { data: plusData, error: plusError, count } = await supabase
        .from('plus')
        .select('id, is_paid, plan', { count: 'exact' });

      if (plusError) {
        console.log('❌ plus表访问失败:', plusError.message);
        console.log('错误详情:', plusError);
      } else {
        console.log(`✅ plus表访问成功，共有 ${count || 0} 条记录`);
        if (plusData && plusData.length > 0) {
          console.log('样本数据:', plusData.slice(0, 2));
        }
      }
    } catch (error) {
      console.log('❌ plus表查询异常:', error.message);
    }

    // 4. 检查user_daily_quota表
    console.log('\n🔍 检查user_daily_quota表:');
    try {
      const { data: quotaData, error: quotaError, count } = await supabase
        .from('user_daily_quota')
        .select('id, pdf_count, chat_count, quota_date', { count: 'exact' });

      if (quotaError) {
        console.log('❌ user_daily_quota表访问失败:', quotaError.message);
        console.log('错误详情:', quotaError);
      } else {
        console.log(`✅ user_daily_quota表访问成功，共有 ${count || 0} 条记录`);
        if (quotaData && quotaData.length > 0) {
          console.log('样本数据:', quotaData.slice(0, 2));
        }
      }
    } catch (error) {
      console.log('❌ user_daily_quota表查询异常:', error.message);
    }

    // 5. 检查pdfs表
    console.log('\n🔍 检查pdfs表:');
    try {
      const { data: pdfsData, error: pdfsError, count } = await supabase
        .from('pdfs')
        .select('id, name, user_id', { count: 'exact' });

      if (pdfsError) {
        console.log('❌ pdfs表访问失败:', pdfsError.message);
        console.log('错误详情:', pdfsError);
      } else {
        console.log(`✅ pdfs表访问成功，共有 ${count || 0} 条记录`);
        if (pdfsData && pdfsData.length > 0) {
          console.log('样本数据:', pdfsData.slice(0, 2));
        }
      }
    } catch (error) {
      console.log('❌ pdfs表查询异常:', error.message);
    }

    // 6. 检查用户表
    console.log('\n🔍 检查auth.users表:');
    try {
      const { data: usersData, error: usersError, count } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.log('❌ auth.users表访问失败:', usersError.message);
      } else {
        console.log(`✅ auth.users表访问成功，共有 ${usersData.users.length} 个用户`);
        if (usersData.users.length > 0) {
          console.log('样本用户:', usersData.users.slice(0, 2).map(u => ({ id: u.id, email: u.email })));
        }
      }
    } catch (error) {
      console.log('❌ auth.users表查询异常:', error.message);
    }

    // 7. 尝试执行RLS策略检查查询
    console.log('\n🔍 尝试检查RLS策略:');
    try {
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('tablename, policyname, cmd, permissive')
        .in('tablename', ['user_profiles', 'plus', 'user_daily_quota', 'pdfs']);

      if (policiesError) {
        console.log('❌ RLS策略查询失败:', policiesError.message);
      } else {
        console.log('✅ RLS策略查询成功:');
        if (policies && policies.length > 0) {
          policies.forEach(policy => {
            console.log(`  - ${policy.tablename}.${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
          });
        } else {
          console.log('  - 未找到任何RLS策略');
        }
      }
    } catch (error) {
      console.log('❌ RLS策略查询异常:', error.message);
    }

  } catch (error) {
    console.error('❌ 数据库状态检查失败:', error);
  }
}

// 运行检查
checkDatabaseStatus().then(() => {
  console.log('\n✨ 数据库状态检查完成');
}).catch((error) => {
  console.error('❌ 检查过程失败:', error);
});