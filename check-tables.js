const { Client } = require('pg');

async function checkTables() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Nlx9iOYZtghqQO0X@db.pwlvfmywfzllopuiisxg.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('已连接到数据库');

    // 查看所有表
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('现有表:');
    tablesResult.rows.forEach(row => {
      console.log('-', row.tablename);
    });

    // 检查是否有pdfs表
    const pdfsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pdfs' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    if (pdfsResult.rows.length > 0) {
      console.log('\npdfs表结构:');
      pdfsResult.rows.forEach(row => {
        console.log('-', row.column_name, ':', row.data_type);
      });
    } else {
      console.log('\n⚠️  pdfs表不存在');
    }

    // 检查是否有user_profiles表
    const userProfilesResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    if (userProfilesResult.rows.length > 0) {
      console.log('\nuser_profiles表结构:');
      userProfilesResult.rows.forEach(row => {
        console.log('-', row.column_name, ':', row.data_type);
      });
    } else {
      console.log('\n⚠️  user_profiles表不存在');
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await client.end();
  }
}

checkTables();