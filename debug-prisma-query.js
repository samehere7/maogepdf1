const { PrismaClient } = require('./lib/generated/prisma');

async function debugPrismaQuery() {
  // 启用查询日志
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  console.log('🔍 调试Prisma查询...');
  
  try {
    // 测试user_profiles查询
    console.log('\n📋 测试user_profiles.findUnique查询...');
    const testUserId = '819fde1e-0fe0-46e7-86f9-32fbdfdb8ad8';
    
    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: testUserId }
    });
    
    console.log('✅ 查询成功:', userProfile);
    
    // 测试pdfs查询
    console.log('\n📄 测试pdfs.findMany查询...');
    const pdfs = await prisma.pdfs.findMany({
      where: { user_id: testUserId },
      take: 5
    });
    
    console.log('✅ PDF查询成功，数量:', pdfs.length);
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  debugPrismaQuery();
}

module.exports = { debugPrismaQuery };