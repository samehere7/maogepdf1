const { PrismaClient } = require('./lib/generated/prisma');

async function checkDatabaseStructure() {
  const prisma = new PrismaClient();
  
  console.log('🔍 检查数据库表结构...');
  
  try {
    // 测试连接
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 数据库连接成功');
    
    // 检查表是否存在
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema IN ('public', 'auth')
      AND table_name IN ('users', 'pdfs', 'chat_messages', 'user_profiles', 'plus', 'user_daily_quota')
      ORDER BY table_schema, table_name
    `;
    
    console.log('\n📋 现有表：');
    tables.forEach(table => {
      console.log(`- ${table.table_schema}.${table.table_name}`);
    });
    
    // 检查auth.users表结构
    console.log('\n🔍 检查auth.users表结构：');
    try {
      const authUsersColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users'
        ORDER BY ordinal_position
      `;
      
      authUsersColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } catch (error) {
      console.log('❌ auth.users表不存在或无法访问');
    }
    
    // 检查public.pdfs表结构
    console.log('\n🔍 检查public.pdfs表结构：');
    try {
      const pdfsColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'pdfs'
        ORDER BY ordinal_position
      `;
      
      pdfsColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } catch (error) {
      console.log('❌ public.pdfs表不存在或无法访问');
    }
    
    // 检查public.chat_messages表结构
    console.log('\n🔍 检查public.chat_messages表结构：');
    try {
      const chatColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'chat_messages'
        ORDER BY ordinal_position
      `;
      
      chatColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } catch (error) {
      console.log('❌ public.chat_messages表不存在或无法访问');
    }
    
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkDatabaseStructure();
}

module.exports = { checkDatabaseStructure };