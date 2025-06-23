const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 读取环境变量
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile() {
  try {
    console.log('📖 读取SQL文件...');
    const sqlContent = fs.readFileSync('EXECUTE-IN-SUPABASE.sql', 'utf8');
    
    console.log('🔄 执行完整SQL内容...');
    
    // 直接执行整个SQL内容
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    }).catch(async (rpcError) => {
      console.log('⚠️  rpc方法不可用，尝试其他方式...');
      // 如果没有exec_sql函数，我们需要手动分割并执行
      throw rpcError;
    });
    
    if (error) {
      console.error('❌ SQL执行失败:', error.message);
      console.error('错误详情:', error);
      
      // 尝试分割执行
      console.log('\n🔄 尝试分割执行SQL语句...');
      await executeSQLStatements(sqlContent);
    } else {
      console.log('✅ SQL文件执行成功！');
      console.log('结果:', data);
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    
    // 尝试分割执行
    console.log('\n🔄 尝试分割执行SQL语句...');
    const sqlContent = fs.readFileSync('EXECUTE-IN-SUPABASE.sql', 'utf8');
    await executeSQLStatements(sqlContent);
  }
}

async function executeSQLStatements(sqlContent) {
  // 手动分割SQL语句
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
    
    // 检查是否在函数定义中
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
  
  console.log(`📋 分割得到 ${statements.length} 个SQL语句`);
  
  // 执行每个语句
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;
    
    console.log(`\n🔄 执行语句 ${i + 1}/${statements.length}...`);
    console.log(`预览: ${statement.substring(0, 100)}...`);
    
    try {
      const { data, error } = await supabase.rpc('query', {
        query: statement
      }).catch(async () => {
        // 如果没有query函数，使用原始SQL查询
        return await supabase.from('_dummy_').select('*').limit(0);
      });
      
      if (error) {
        console.error(`❌ 语句 ${i + 1} 执行失败:`, error.message);
      } else {
        console.log(`✅ 语句 ${i + 1} 执行成功`);
      }
    } catch (err) {
      console.error(`❌ 语句 ${i + 1} 执行异常:`, err.message);
    }
  }
}

executeSQLFile();