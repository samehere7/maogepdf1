#!/usr/bin/env node

// 这个脚本用于应用Supabase存储桶RLS策略
// 使用方法: node scripts/apply-storage-policy.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 加载环境变量
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

  console.log('正在连接到Supabase...');
  
  // 创建管理员客户端
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', 'storage-policy.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('正在应用存储桶RLS策略...');
    
    // 执行SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('应用RLS策略失败:', error);
      process.exit(1);
    }

    console.log('✅ 存储桶RLS策略已成功应用!');
    
    // 验证pdfs桶是否存在
    const { data: buckets, error: bucketsError } = await supabase
      .from('storage.buckets')
      .select('id, public')
      .eq('id', 'pdfs')
      .single();
      
    if (bucketsError) {
      console.error('验证存储桶失败:', bucketsError);
    } else {
      console.log('存储桶信息:', buckets);
    }
    
    // 验证RLS策略
    const { data: policies, error: policiesError } = await supabase
      .from('storage.policies')
      .select('*')
      .eq('table', 'objects');
      
    if (policiesError) {
      console.error('验证RLS策略失败:', policiesError);
    } else {
      console.log('已应用的RLS策略:', policies);
    }
    
  } catch (error) {
    console.error('执行脚本时出错:', error);
    process.exit(1);
  }
}

main(); 