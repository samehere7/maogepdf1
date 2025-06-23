const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 测试Supabase连接和密钥...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('环境变量检查:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 已设置' : '❌ 未设置');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅ 已设置' : '❌ 未设置');

if (supabaseAnonKey) {
  console.log('Anon密钥前缀:', supabaseAnonKey.substring(0, 20) + '...');
}
if (supabaseServiceRoleKey) {
  console.log('Service密钥前缀:', supabaseServiceRoleKey.substring(0, 20) + '...');
}

async function testConnections() {
  console.log('\n🧪 测试anon密钥连接:');
  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // 测试简单查询
    const { data, error } = await anonClient
      .from('pdfs')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Anon密钥测试失败:', error.message);
    } else {
      console.log('✅ Anon密钥连接成功');
    }
  } catch (err) {
    console.log('❌ Anon密钥连接异常:', err.message);
  }

  console.log('\n🧪 测试service_role密钥连接:');
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 测试管理员操作
    const { data: users, error: usersError } = await serviceClient.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Service密钥测试失败:', usersError.message);
    } else {
      console.log('✅ Service密钥连接成功，用户数量:', users.users.length);
    }
  } catch (err) {
    console.log('❌ Service密钥连接异常:', err.message);
  }

  console.log('\n🧪 测试直接数据库查询:');
  try {
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 尝试查询一个简单的表
    const { data, error } = await serviceClient
      .from('pdfs')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ 数据库查询失败:', error.message);
      console.log('错误详情:', error);
    } else {
      console.log('✅ 数据库查询成功');
    }
  } catch (err) {
    console.log('❌ 数据库查询异常:', err.message);
  }
}

testConnections().then(() => {
  console.log('\n✨ 连接测试完成');
}).catch((error) => {
  console.error('❌ 测试过程失败:', error);
});