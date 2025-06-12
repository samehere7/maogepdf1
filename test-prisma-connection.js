const { PrismaClient } = require('./lib/generated/prisma');

async function testPrismaConnection() {
  const prisma = new PrismaClient();
  
  console.log('🔍 测试Prisma连接和表访问...');
  
  try {
    // 1. 测试基本连接
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 基本数据库连接成功');
    
    // 2. 测试user_profiles表
    try {
      const userProfiles = await prisma.user_profiles.findMany({
        take: 1
      });
      console.log('✅ user_profiles表访问成功，记录数:', userProfiles.length);
    } catch (error) {
      console.log('❌ user_profiles表访问失败:', error.message);
    }
    
    // 3. 测试pdfs表
    try {
      const pdfs = await prisma.pdfs.findMany({
        take: 1
      });
      console.log('✅ pdfs表访问成功，记录数:', pdfs.length);
    } catch (error) {
      console.log('❌ pdfs表访问失败:', error.message);
    }
    
    // 4. 测试chat_messages表
    try {
      const messages = await prisma.chat_messages.findMany({
        take: 1
      });
      console.log('✅ chat_messages表访问成功，记录数:', messages.length);
    } catch (error) {
      console.log('❌ chat_messages表访问失败:', error.message);
    }
    
    // 5. 检查数据库URL
    console.log('\n📝 数据库配置检查:');
    console.log('DATABASE_URL 存在:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL 前缀:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ 连接测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testPrismaConnection();
}

module.exports = { testPrismaConnection };