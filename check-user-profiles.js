const { PrismaClient } = require('./lib/generated/prisma');

async function checkUserProfiles() {
  const prisma = new PrismaClient();
  
  console.log('🔍 检查user_profiles表详细结构...');
  
  try {
    // 检查user_profiles表结构
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user_profiles'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 user_profiles表字段：');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (可空: ${col.is_nullable})`);
    });
    
    // 检查现有数据
    const profiles = await prisma.user_profiles.findMany();
    console.log(`\n👥 现有用户档案数量: ${profiles.length}`);
    profiles.forEach(profile => {
      console.log(`  - ID: ${profile.id}, Email: ${profile.email}, Name: ${profile.name}`);
    });
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkUserProfiles();
}

module.exports = { checkUserProfiles };