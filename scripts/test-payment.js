#!/usr/bin/env node

// 测试支付API的脚本
// 使用方法: node scripts/test-payment.js

const { PrismaClient } = require('@prisma/client');

async function testPaymentAPI() {
  console.log('开始测试支付集成...');
  
  try {
    // 测试数据库连接
    const prisma = new PrismaClient();
    
    // 检查是否有测试用户
    const testUser = await prisma.user_profiles.findFirst({
      where: {
        email: {
          contains: 'test'
        }
      }
    });
    
    if (!testUser) {
      console.log('❌ 未找到测试用户，请先创建一个测试用户');
      return;
    }
    
    console.log('✅ 找到测试用户:', testUser.email);
    
    // 测试支付API端点
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    console.log('测试月付计划...');
    const monthlyResponse = await fetch(`${baseUrl}/api/payment/paddle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: 'monthly',
        userId: testUser.id
      })
    });
    
    if (monthlyResponse.ok) {
      const monthlyData = await monthlyResponse.json();
      console.log('✅ 月付计划API响应正常:', monthlyData.checkoutUrl.substring(0, 50) + '...');
    } else {
      console.log('❌ 月付计划API测试失败:', await monthlyResponse.text());
    }
    
    console.log('测试年付计划...');
    const yearlyResponse = await fetch(`${baseUrl}/api/payment/paddle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: 'yearly',
        userId: testUser.id
      })
    });
    
    if (yearlyResponse.ok) {
      const yearlyData = await yearlyResponse.json();
      console.log('✅ 年付计划API响应正常:', yearlyData.checkoutUrl.substring(0, 50) + '...');
    } else {
      console.log('❌ 年付计划API测试失败:', await yearlyResponse.text());
    }
    
    // 检查Plus表结构
    const plusCount = await prisma.plus.count();
    console.log(`✅ Plus表当前有 ${plusCount} 条记录`);
    
    await prisma.$disconnect();
    console.log('✅ 支付集成测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 检查是否在生产环境
if (process.env.NODE_ENV === 'production') {
  console.log('警告: 请不要在生产环境运行此测试脚本');
  process.exit(1);
}

testPaymentAPI();