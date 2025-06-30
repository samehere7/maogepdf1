const { PrismaClient } = require('./lib/generated/prisma');

async function createMissingTables() {
  const prisma = new PrismaClient();
  
  console.log('🔧 开始创建缺失的数据库表...');
  
  try {
    // 创建 public.pdfs 表
    console.log('📄 创建 public.pdfs 表...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS public.pdfs (
        id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        upload_date TIMESTAMPTZ DEFAULT NOW(),
        last_viewed TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        content_type TEXT DEFAULT 'application/pdf',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    
    // 创建索引
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_pdfs_upload_date ON public.pdfs(upload_date DESC)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_pdfs_user_id ON public.pdfs(user_id)`;
    
    console.log('✅ public.pdfs 表创建成功');
    
    // 创建 public.chat_messages 表
    console.log('💬 创建 public.chat_messages 表...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS public.chat_messages (
        id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        document_id TEXT REFERENCES public.pdfs(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_user BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    
    // 创建索引
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_chat_messages_document_id ON public.chat_messages(document_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id)`;
    
    console.log('✅ public.chat_messages 表创建成功');
    
    // 创建 public.user_profiles 表
    console.log('👤 创建 public.user_profiles 表...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT,
        name TEXT,
        avatar_url TEXT,
        plus BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        expire_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    
    console.log('✅ public.user_profiles 表创建成功');
    
    // 创建 public.plus 表
    console.log('⭐ 创建 public.plus 表...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS public.plus (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        is_paid BOOLEAN DEFAULT TRUE,
        paid_at TIMESTAMPTZ DEFAULT NOW(),
        plan TEXT DEFAULT 'plus',
        expire_at TIMESTAMPTZ,
        pdf_count INTEGER DEFAULT 0,
        chat_count INTEGER DEFAULT 0
      )
    `;
    
    console.log('✅ public.plus 表创建成功');
    
    // 创建 public.user_daily_quota 表
    console.log('📊 创建 public.user_daily_quota 表...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS public.user_daily_quota (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        pdf_count INTEGER DEFAULT 0,
        chat_count INTEGER DEFAULT 0,
        quota_date DATE DEFAULT CURRENT_DATE
      )
    `;
    
    console.log('✅ public.user_daily_quota 表创建成功');
    
    // 为现有用户创建profile
    console.log('👥 为现有用户创建profile...');
    const result = await prisma.$executeRaw`
      INSERT INTO public.user_profiles (id, email, name, plus, is_active, created_at, updated_at)
      SELECT 
        id,
        email,
        COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)) as name,
        FALSE as plus,
        TRUE as is_active,
        created_at,
        updated_at
      FROM auth.users
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE user_profiles.id = users.id
      )
    `;
    
    console.log(`✅ 已为 ${result} 个用户创建profile记录`);
    
    console.log('\n🎉 所有缺失的表创建完成！');
    
    // 验证表创建
    console.log('\n🔍 验证表结构...');
    const tables = await prisma.$queryRaw`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('pdfs', 'chat_messages', 'user_profiles', 'plus', 'user_daily_quota')
      ORDER BY table_name
    `;
    
    console.log('✅ 已创建的表：');
    tables.forEach(table => {
      console.log(`- ${table.table_schema}.${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ 创建表失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createMissingTables();
}

module.exports = { createMissingTables };