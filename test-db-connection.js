const { PrismaClient } = require('./lib/generated/prisma');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  console.log('🔍 测试数据库连接...');
  
  try {
    // 测试连接
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ 数据库连接成功');
    
    // 检查pdfs表
    console.log('📊 检查pdfs表结构...');
    const pdfsCount = await prisma.pdfs.count();
    console.log(`📄 当前pdfs表中有 ${pdfsCount} 条记录`);
    
    // 检查最近的PDF记录
    const recentPdfs = await prisma.pdfs.findMany({
      take: 5,
      orderBy: { created_at: 'desc' }
    });
    
    console.log('📋 最近的PDF记录:');
    recentPdfs.forEach(pdf => {
      console.log(`- ID: ${pdf.id}, 名称: ${pdf.name}, 用户: ${pdf.user_id}`);
    });
    
    // 检查用户表
    console.log('👥 检查用户...');
    const usersCount = await prisma.users.count();
    console.log(`👤 当前users表中有 ${usersCount} 个用户`);
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase };