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

async function checkPolicies() {
  console.log('🔍 检查当前RLS策略状态...');

  try {
    // 1. 检查pdfs表策略
    console.log('\n📋 检查PDFs表策略：');
    try {
      const { data: pdfPolicies, error: pdfPolicyError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'pdfs');

      if (pdfPolicyError) {
        console.log('❌ 无法查询PDF策略:', pdfPolicyError.message);
      } else {
        console.log(`✅ 找到 ${pdfPolicies.length} 个PDF策略:`);
        pdfPolicies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
        });
      }
    } catch (error) {
      console.log('⚠️ PDF策略查询失败:', error.message);
    }

    // 2. 检查user_daily_quota表策略
    console.log('\n📋 检查配额表策略：');
    try {
      const { data: quotaPolicies, error: quotaPolicyError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'user_daily_quota');

      if (quotaPolicyError) {
        console.log('❌ 无法查询配额策略:', quotaPolicyError.message);
      } else {
        console.log(`✅ 找到 ${quotaPolicies.length} 个配额策略:`);
        quotaPolicies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
        });
      }
    } catch (error) {
      console.log('⚠️ 配额策略查询失败:', error.message);
    }

    // 3. 检查shares表策略
    console.log('\n📋 检查分享表策略：');
    try {
      const { data: sharesPolicies, error: sharesPolicyError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'shares');

      if (sharesPolicyError) {
        console.log('❌ 无法查询分享策略:', sharesPolicyError.message);
      } else {
        console.log(`✅ 找到 ${sharesPolicies.length} 个分享策略:`);
        sharesPolicies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
        });
      }
    } catch (error) {
      console.log('⚠️ 分享策略查询失败:', error.message);
    }

    // 4. 检查表的RLS状态
    console.log('\n📋 检查表的RLS启用状态：');
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .in('tablename', ['pdfs', 'user_daily_quota', 'shares']);

      if (tablesError) {
        console.log('❌ 无法查询表状态:', tablesError.message);
      } else {
        console.log('✅ 表RLS状态:');
        tables.forEach(table => {
          console.log(`  - ${table.tablename}: RLS ${table.rowsecurity ? '已启用' : '未启用'}`);
        });
      }
    } catch (error) {
      console.log('⚠️ 表状态查询失败:', error.message);
    }

    // 5. 测试简单的表访问
    console.log('\n📋 测试表访问：');
    
    // 测试PDFs表
    try {
      const { data: pdfCount, error: pdfCountError } = await supabase
        .from('pdfs')
        .select('id', { count: 'exact', head: true });

      if (pdfCountError) {
        console.log('❌ PDFs表访问失败:', pdfCountError.message);
      } else {
        console.log(`✅ PDFs表访问成功，共有 ${pdfCount?.length || 0} 条记录`);
      }
    } catch (error) {
      console.log('⚠️ PDFs表访问异常:', error.message);
    }

    // 测试配额表
    try {
      const { data: quotaCount, error: quotaCountError } = await supabase
        .from('user_daily_quota')
        .select('id', { count: 'exact', head: true });

      if (quotaCountError) {
        console.log('❌ 配额表访问失败:', quotaCountError.message);
      } else {
        console.log(`✅ 配额表访问成功，共有 ${quotaCount?.length || 0} 条记录`);
      }
    } catch (error) {
      console.log('⚠️ 配额表访问异常:', error.message);
    }

  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  }
}

// 运行检查
checkPolicies().then(() => {
  console.log('\n✨ 策略检查完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 策略检查失败:', error);
  process.exit(1);
});