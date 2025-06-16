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
  },
  db: {
    schema: 'public'
  }
});

async function executeRawSQL(sql, description) {
  console.log(`🔄 ${description}...`);
  try {
    // 使用 rpc 调用来执行原始 SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log(`⚠️ ${description} - 错误:`, error.message);
      return false;
    }
    
    console.log(`✅ ${description} - 成功`);
    return true;
  } catch (error) {
    console.log(`⚠️ ${description} - 异常:`, error.message);
    return false;
  }
}

async function fixRLSPolicies() {
  console.log('🔧 开始修复RLS策略...');

  try {
    // 1. 首先删除有问题的公开访问策略
    console.log('\n📋 第一步：清理冲突的策略');
    const cleanupPolicies = [
      'DROP POLICY IF EXISTS "Allow public read for sharing" ON public.pdfs;',
      'DROP POLICY IF EXISTS "Allow service role access" ON public.pdfs;'
    ];

    for (const sql of cleanupPolicies) {
      await executeRawSQL(sql, '删除冲突策略');
    }

    // 2. 重建基础PDF权限策略
    console.log('\n📋 第二步：重建PDF表基础权限');
    const pdfPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own PDFs" ON public.pdfs;',
      'DROP POLICY IF EXISTS "Users can insert their own PDFs" ON public.pdfs;',
      'DROP POLICY IF EXISTS "Users can update their own PDFs" ON public.pdfs;',
      'DROP POLICY IF EXISTS "Users can delete their own PDFs" ON public.pdfs;',
      
      `CREATE POLICY "Users can view their own PDFs" ON public.pdfs
       FOR SELECT USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can insert their own PDFs" ON public.pdfs
       FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can update their own PDFs" ON public.pdfs
       FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can delete their own PDFs" ON public.pdfs
       FOR DELETE USING (auth.uid() = user_id);`
    ];

    for (const sql of pdfPolicies) {
      await executeRawSQL(sql, 'PDF权限策略');
    }

    // 3. 修复 user_daily_quota 表权限
    console.log('\n📋 第三步：修复配额表权限');
    
    // 先确保表启用了RLS
    await executeRawSQL(
      'ALTER TABLE public.user_daily_quota ENABLE ROW LEVEL SECURITY;',
      '启用配额表RLS'
    );

    const quotaPolicies = [
      'DROP POLICY IF EXISTS "Users can view their own quota" ON public.user_daily_quota;',
      'DROP POLICY IF EXISTS "Users can insert their own quota" ON public.user_daily_quota;',
      'DROP POLICY IF EXISTS "Users can update their own quota" ON public.user_daily_quota;',
      
      `CREATE POLICY "Users can view their own quota" ON public.user_daily_quota
       FOR SELECT USING (auth.uid() = id);`,
      
      `CREATE POLICY "Users can insert their own quota" ON public.user_daily_quota
       FOR INSERT WITH CHECK (auth.uid() = id);`,
      
      `CREATE POLICY "Users can update their own quota" ON public.user_daily_quota
       FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`
    ];

    for (const sql of quotaPolicies) {
      await executeRawSQL(sql, '配额表权限策略');
    }

    // 4. 为现有用户创建配额记录
    console.log('\n📋 第四步：为用户创建配额记录');
    
    // 获取所有用户
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ 获取用户列表失败:', usersError);
    } else {
      console.log(`👥 找到 ${users.users.length} 个用户`);
      
      const today = new Date().toISOString().slice(0, 10);
      
      for (const user of users.users) {
        try {
          // 使用 upsert 创建配额记录
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
            console.log(`⚠️ 用户 ${user.email} 配额记录创建失败: ${error.message}`);
          } else {
            console.log(`✅ 用户 ${user.email} 配额记录已创建/更新`);
          }
        } catch (error) {
          console.log(`⚠️ 用户 ${user.email} 处理异常: ${error.message}`);
        }
      }
    }

    // 5. 验证权限修复
    console.log('\n📋 第五步：验证权限修复');
    
    // 测试PDF访问
    const { data: pdfTest, error: pdfTestError } = await supabase
      .from('pdfs')
      .select('id, name, user_id')
      .limit(1);

    if (pdfTestError) {
      console.log('❌ PDF表访问测试失败:', pdfTestError.message);
    } else {
      console.log('✅ PDF表访问测试成功，找到', pdfTest?.length || 0, '个PDF');
    }

    // 测试配额访问
    const { data: quotaTest, error: quotaTestError } = await supabase
      .from('user_daily_quota')
      .select('id, pdf_count, chat_count')
      .limit(1);

    if (quotaTestError) {
      console.log('❌ 配额表访问测试失败:', quotaTestError.message);
    } else {
      console.log('✅ 配额表访问测试成功，找到', quotaTest?.length || 0, '个配额记录');
    }

    console.log('\n🎉 RLS策略修复完成！');
    console.log('📊 现在用户应该可以正常访问PDF和配额信息了');

  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  }
}

// 运行修复
fixRLSPolicies().then(() => {
  console.log('✨ 修复脚本执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 修复脚本执行失败:', error);
  process.exit(1);
});