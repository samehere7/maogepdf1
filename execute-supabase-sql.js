const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 从环境变量文件读取配置
require('dotenv').config({ path: '.env.local' });

console.log('🚀 开始执行EXECUTE-IN-SUPABASE.sql文件...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 缺少必要的环境变量');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

console.log('📝 配置信息:');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key前缀:', serviceRoleKey.substring(0, 20) + '...');

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL() {
  try {
    console.log('\n📖 读取SQL文件...');
    const sqlContent = fs.readFileSync('EXECUTE-IN-SUPABASE.sql', 'utf8');
    
    console.log('✅ SQL文件读取成功');
    console.log(`📏 文件大小: ${sqlContent.length} 字符\n`);

    // 由于Supabase客户端不支持直接执行任意SQL，我们需要使用HTTP直接调用
    console.log('🔄 通过Supabase Edge Function执行SQL...');
    
    // 尝试使用Supabase的SQL执行功能
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlContent
    }).catch(async () => {
      // 如果没有exec_sql函数，我们分段执行
      console.log('⚠️  exec_sql函数不可用，改为分段执行...');
      return await executeInParts(sqlContent);
    });

    if (error) {
      console.error('❌ SQL执行失败:', error.message);
      if (error.details) console.error('详情:', error.details);
      
      // 尝试分段执行
      console.log('\n🔄 尝试分段执行SQL...');
      await executeInParts(sqlContent);
    } else {
      console.log('✅ SQL执行成功！');
      if (data) console.log('结果:', data);
    }

  } catch (error) {
    console.error('❌ 执行过程出错:', error.message);
    
    // 最后的备选方案：分段执行
    console.log('\n🔄 最后尝试：分段执行SQL...');
    try {
      const sqlContent = fs.readFileSync('EXECUTE-IN-SUPABASE.sql', 'utf8');
      await executeInParts(sqlContent);
    } catch (finalError) {
      console.error('❌ 所有执行方式都失败:', finalError.message);
    }
  }
}

async function executeInParts(sqlContent) {
  console.log('📋 开始分段执行SQL...');
  
  // 手动解析SQL语句
  const statements = parseSQLStatements(sqlContent);
  
  console.log(`📊 解析得到 ${statements.length} 个SQL语句\n`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement.trim()) continue;
    
    console.log(`🔄 执行语句 ${i + 1}/${statements.length}:`);
    console.log(`预览: ${statement.substring(0, 80)}...`);
    
    try {
      // 尝试通过rpc调用执行
      const { data, error } = await supabase.rpc('exec', {
        sql: statement
      }).catch(async () => {
        // 如果rpc不可用，检查是否是简单的查询
        if (statement.toLowerCase().trim().startsWith('select')) {
          return await supabase.from('_dummy_').select('*').limit(0);
        }
        throw new Error('RPC执行失败，且不是查询语句');
      });
      
      if (error) {
        console.error(`❌ 语句 ${i + 1} 失败:`, error.message);
        failureCount++;
      } else {
        console.log(`✅ 语句 ${i + 1} 成功`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ 语句 ${i + 1} 异常:`, err.message);
      failureCount++;
    }
    
    console.log(''); // 空行分隔
  }
  
  console.log('📊 执行统计:');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failureCount}`);
  console.log(`📈 成功率: ${((successCount / (successCount + failureCount)) * 100).toFixed(1)}%`);
}

function parseSQLStatements(sqlContent) {
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  let dollarQuoteCount = 0;
  
  const lines = sqlContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过注释和空行
    if (trimmedLine.startsWith('--') || trimmedLine === '') {
      continue;
    }
    
    // 检查是否在函数定义中（使用$$符号）
    if (trimmedLine.includes('$$')) {
      dollarQuoteCount++;
      inFunction = dollarQuoteCount % 2 === 1;
    }
    
    currentStatement += line + '\n';
    
    // 如果不在函数中且遇到分号，说明语句结束
    if (!inFunction && trimmedLine.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  // 添加最后一个语句（如果有）
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(stmt => stmt.length > 0);
}

// 执行主函数
executeSQL().then(() => {
  console.log('\n🎉 SQL执行流程完成！');
}).catch((error) => {
  console.error('\n❌ 执行流程失败:', error);
});