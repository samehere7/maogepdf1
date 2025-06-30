const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthenticatedUpload() {
  try {
    console.log('Testing authenticated PDF upload...');
    
    // 1. 首先检查当前用户认证状态
    console.log('\n1. Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('No authenticated user found. You need to login first.');
      console.log('Please visit http://localhost:3000/en/auth/login to login with Google');
      return;
    }
    
    console.log('User authenticated:', user.email, 'ID:', user.id);
    
    // 2. 获取访问令牌
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      console.log('No valid session found');
      return;
    }
    
    console.log('Access token obtained');
    
    // 3. 准备测试文件
    const testPdfPath = path.join(__dirname, 'public', 'sample.pdf');
    if (!fs.existsSync(testPdfPath)) {
      console.error('Test PDF file not found at:', testPdfPath);
      return;
    }
    
    // 4. 创建FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPdfPath));
    formData.append('quality', 'high');
    
    // 5. 发送上传请求（模拟前端请求）
    console.log('\n2. Sending upload request...');
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        // Supabase会自动在请求中包含认证信息，这里我们模拟浏览器环境
        'Cookie': `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${JSON.stringify(session.session)}`
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('Upload successful!');
      console.log('PDF ID:', result.pdf?.id);
      console.log('PDF URL:', result.pdf?.url);
    } else {
      console.log('Upload failed');
      console.log('Error:', responseText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// 首先检查开发服务器是否运行
fetch('http://localhost:3000')
  .then(() => {
    console.log('Development server is running');
    testAuthenticatedUpload();
  })
  .catch(() => {
    console.log('Development server is not running. Please start it first with: npm run dev');
  });