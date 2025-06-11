#!/usr/bin/env node

// 这个脚本用于修复User表，添加plus字段，并创建user_with_plus视图
// 使用方法: node scripts/fix-user-plus.js

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('开始修复User表...');
  
  try {
    // 1. 执行SQL脚本
    console.log('正在应用SQL修改...');
    const sqlPath = path.join(__dirname, 'fix-user-plus.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // 创建Prisma客户端
    const prisma = new PrismaClient();
    
    // 使用Prisma执行SQL
    await prisma.$executeRawUnsafe(sqlContent);
    console.log('SQL脚本执行成功');
    
    // 2. 生成Prisma客户端
    console.log('正在生成Prisma客户端...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Prisma客户端生成成功');
    
    // 3. 检查User表是否有plus字段
    console.log('正在验证修改...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        plus: true,
        is_active: true
      }
    });
    
    console.log(`找到 ${users.length} 个用户，示例:`);
    if (users.length > 0) {
      console.log(users[0]);
    }
    
    // 4. 检查user_with_plus视图
    try {
      const result = await prisma.$queryRaw`SELECT * FROM "user_with_plus" LIMIT 1`;
      console.log('user_with_plus视图可用，示例:');
      console.log(result);
    } catch (viewError) {
      console.error('无法查询user_with_plus视图:', viewError);
    }
    
    console.log('✅ User表修复完成!');
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('执行脚本时出错:', error);
    process.exit(1);
  }
}

main(); 