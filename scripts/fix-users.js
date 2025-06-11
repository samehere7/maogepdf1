#!/usr/bin/env node

// 这个脚本用于修复数据库中的用户记录，确保User表中的记录与Supabase Auth中的用户匹配
// 使用方法: node scripts/fix-users.js

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function main() {
  // 检查环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('错误: 缺少Supabase环境变量');
    console.error('请确保.env.local文件中包含NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('正在连接到Supabase和Prisma...');
  
  // 创建Supabase管理员客户端
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // 创建Prisma客户端
  const prisma = new PrismaClient();

  try {
    // 1. 获取所有Supabase Auth用户
    console.log('正在获取Supabase Auth用户...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('获取Auth用户失败:', authError);
      process.exit(1);
    }
    
    console.log(`找到 ${authUsers.users.length} 个Auth用户`);
    
    // 2. 获取所有Prisma用户
    console.log('正在获取数据库用户...');
    const dbUsers = await prisma.user.findMany();
    console.log(`找到 ${dbUsers.length} 个数据库用户`);
    
    // 3. 创建用户映射
    const dbUserMap = new Map();
    dbUsers.forEach(user => {
      dbUserMap.set(user.id, user);
    });
    
    // 4. 同步用户
    console.log('正在同步用户...');
    let created = 0;
    let updated = 0;
    
    for (const authUser of authUsers.users) {
      const { id, email, user_metadata } = authUser;
      
      if (dbUserMap.has(id)) {
        // 更新现有用户
        const dbUser = dbUserMap.get(id);
        if (dbUser.email !== email || 
            (user_metadata?.name && dbUser.name !== user_metadata.name)) {
          await prisma.user.update({
            where: { id },
            data: {
              email,
              name: user_metadata?.name || dbUser.name || email.split('@')[0]
            }
          });
          updated++;
          console.log(`已更新用户: ${id} (${email})`);
        }
      } else {
        // 创建新用户
        await prisma.user.create({
          data: {
            id,
            email,
            name: user_metadata?.name || email.split('@')[0]
          }
        });
        created++;
        console.log(`已创建用户: ${id} (${email})`);
      }
    }
    
    console.log(`同步完成! 创建了 ${created} 个新用户，更新了 ${updated} 个现有用户`);
    
    // 5. 检查PDF记录中的userId是否正确
    console.log('正在检查PDF记录...');
    const pdfs = await prisma.pDF.findMany();
    console.log(`找到 ${pdfs.length} 个PDF记录`);
    
    let fixedPdfs = 0;
    for (const pdf of pdfs) {
      // 检查userId是否是邮箱格式
      if (pdf.userId.includes('@')) {
        // 查找对应的用户
        const matchingUser = dbUsers.find(u => u.email === pdf.userId);
        if (matchingUser) {
          await prisma.pDF.update({
            where: { id: pdf.id },
            data: { userId: matchingUser.id }
          });
          fixedPdfs++;
          console.log(`已修复PDF记录: ${pdf.id}, userId从 ${pdf.userId} 更新为 ${matchingUser.id}`);
        } else {
          console.warn(`警告: PDF ${pdf.id} 的userId(${pdf.userId})是邮箱格式，但找不到对应的用户`);
        }
      }
    }
    
    console.log(`修复完成! 修复了 ${fixedPdfs} 个PDF记录的userId`);
    
  } catch (error) {
    console.error('执行脚本时出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 