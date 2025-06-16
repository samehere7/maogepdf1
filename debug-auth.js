const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ 缺少环境变量');
  process.exit(1);
}

// 使用服务角色密钥创建客户端
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugAuth() {
  console.log('🔍 调试认证状态...');

  try {
    // 获取所有用户会话
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ 获取用户列表失败:', usersError);
      return;
    }

    console.log(`👥 找到 ${users.users.length} 个用户:`);
    users.users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
      console.log(`    最后登录: ${user.last_sign_in_at}`);
      console.log(`    确认邮箱: ${user.email_confirmed_at ? '是' : '否'}`);
    });

    // 测试PDF访问
    console.log('\n🔍 测试PDF访问权限...');
    const testPdfId = '3bbee6e1-c351-46cc-b9fe-d90c1529e0ab';
    
    const { data: pdfData, error: pdfError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', testPdfId)
      .single();

    if (pdfError) {
      console.log('❌ PDF查询失败:', pdfError.message);
    } else {
      console.log('✅ PDF数据:', {
        id: pdfData.id,
        name: pdfData.name,
        user_id: pdfData.user_id,
        url: pdfData.url
      });
    }

  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error);
  }
}

debugAuth().then(() => {
  console.log('✨ 调试完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 调试失败:', error);
  process.exit(1);
});