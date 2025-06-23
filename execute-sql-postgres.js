const { Client } = require('pg');
const fs = require('fs');

// 从环境变量文件读取配置
require('dotenv').config({ path: '.env.local' });

console.log('🚀 使用PostgreSQL直接连接执行SQL...\n');

// 从DATABASE_URL获取连接信息
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:Nlx9iOYZtghqQO0X@db.pwlvfmywfzllopuiisxg.supabase.co:5432/postgres';

console.log('📝 连接信息:');
console.log('Database URL:', databaseUrl.replace(/:[^:]*@/, ':****@'));

async function executeSQL() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('\n🔌 连接到PostgreSQL数据库...');
    await client.connect();
    console.log('✅ 数据库连接成功');

    console.log('\n📖 读取SQL文件...');
    const sqlContent = fs.readFileSync('EXECUTE-IN-SUPABASE.sql', 'utf8');
    console.log('✅ SQL文件读取成功');

    // 解析SQL语句
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
        const result = await client.query(statement);
        console.log(`✅ 语句 ${i + 1} 执行成功`);
        
        // 如果有返回数据，显示一些信息
        if (result.rows && result.rows.length > 0) {
          console.log(`📄 返回 ${result.rows.length} 行数据`);
        }
        if (result.command) {
          console.log(`📝 操作类型: ${result.command}`);
        }
        
        successCount++;
      } catch (err) {
        console.error(`❌ 语句 ${i + 1} 执行失败:`, err.message);
        failureCount++;
        
        // 如果是权限相关错误，尝试继续执行其他语句
        if (err.message.includes('permission') || err.message.includes('already exists')) {
          console.log('⚠️ 继续执行下一个语句...');
        }
      }

      console.log(''); // 空行分隔
    }

    console.log('📊 执行统计:');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failureCount}`);
    console.log(`📈 成功率: ${((successCount / (successCount + failureCount)) * 100).toFixed(1)}%`);

    // 验证结果
    console.log('\n🔍 验证安装结果...');
    
    try {
      // 检查函数是否存在
      const funcCheck = await client.query(`
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name IN ('update_user_plus_status', 'get_user_plus_status')
      `);
      
      console.log(`✅ 找到 ${funcCheck.rows.length} 个函数:`);
      funcCheck.rows.forEach(row => {
        console.log(`  - ${row.routine_name} (${row.routine_type})`);
      });
    } catch (err) {
      console.log('⚠️ 函数检查失败:', err.message);
    }

    try {
      // 检查视图是否存在
      const viewCheck = await client.query(`
        SELECT table_name, table_type 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'user_with_plus'
      `);
      
      if (viewCheck.rows.length > 0) {
        console.log('✅ user_with_plus 视图创建成功');
      } else {
        console.log('❌ user_with_plus 视图未找到');
      }
    } catch (err) {
      console.log('⚠️ 视图检查失败:', err.message);
    }

  } catch (error) {
    console.error('❌ 执行过程出错:', error.message);
  } finally {
    try {
      await client.end();
      console.log('\n🔌 数据库连接已关闭');
    } catch (err) {
      console.log('⚠️ 关闭连接时出错:', err.message);
    }
  }
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