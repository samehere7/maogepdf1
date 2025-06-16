const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createFlashcardTables() {
  // 从环境变量读取数据库连接信息
  const client = new Client({
    connectionString: 'postgresql://postgres:Nlx9iOYZtghqQO0X@db.pwlvfmywfzllopuiisxg.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('已连接到数据库');

    // 读取SQL文件
    const sqlContent = fs.readFileSync(path.join(__dirname, 'create-flashcards-tables.sql'), 'utf8');
    
    // 更智能的SQL语句分割 - 处理多行语句
    const statements = [];
    let currentStatement = '';
    const lines = sqlContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 跳过注释行和空行
      if (trimmedLine.startsWith('--') || trimmedLine === '') {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // 如果行以分号结尾，表示语句结束
      if (trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // 如果还有未完成的语句
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`准备执行 ${statements.length} 条SQL语句`);

    // 执行每条语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`执行第 ${i + 1} 条语句...`);
          console.log('语句类型:', statement.substring(0, 50) + '...');
          await client.query(statement);
          console.log(`✓ 第 ${i + 1} 条语句执行成功`);
        } catch (error) {
          console.error(`✗ 第 ${i + 1} 条语句执行失败:`, error.message);
          console.log('失败的语句:', statement.substring(0, 200) + '...');
        }
      }
    }

    console.log('闪卡表创建完成！');

  } catch (error) {
    console.error('连接数据库失败:', error);
  } finally {
    await client.end();
  }
}

createFlashcardTables();