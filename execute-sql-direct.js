const https = require('https');
const fs = require('fs');

// 从环境变量文件读取配置
require('dotenv').config({ path: '.env.local' });

console.log('🚀 直接通过HTTP执行EXECUTE-IN-SUPABASE.sql文件...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 缺少必要的环境变量');
  process.exit(1);
}

console.log('📝 配置信息:');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key前缀:', serviceRoleKey.substring(0, 20) + '...');

async function executeSQL() {
  try {
    console.log('\n📖 读取SQL文件...');
    const sqlContent = fs.readFileSync('EXECUTE-IN-SUPABASE.sql', 'utf8');
    
    console.log('✅ SQL文件读取成功');
    console.log(`📏 文件大小: ${sqlContent.length} 字符\n`);

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
        const result = await executeStatement(statement);
        if (result.success) {
          console.log(`✅ 语句 ${i + 1} 执行成功`);
          if (result.data) {
            console.log(`📄 结果: ${JSON.stringify(result.data).substring(0, 100)}...`);
          }
          successCount++;
        } else {
          console.error(`❌ 语句 ${i + 1} 执行失败:`, result.error);
          failureCount++;
        }
      } catch (err) {
        console.error(`❌ 语句 ${i + 1} 执行异常:`, err.message);
        failureCount++;
      }
      
      console.log(''); // 空行分隔
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('📊 执行统计:');
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${failureCount}`);
    console.log(`📈 成功率: ${((successCount / (successCount + failureCount)) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ 执行过程出错:', error.message);
  }
}

function executeStatement(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl);
    
    const postData = JSON.stringify({
      query: sql
    });
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': serviceRoleKey,
        'Authorization': 'Bearer ' + serviceRoleKey
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: response });
          } else {
            resolve({ 
              success: false, 
              error: response.message || response.error || `HTTP ${res.statusCode}` 
            });
          }
        } catch (parseError) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: data });
          } else {
            resolve({ 
              success: false, 
              error: `HTTP ${res.statusCode}: ${data}` 
            });
          }
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.write(postData);
    req.end();
  });
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