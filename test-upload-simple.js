const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    console.log('🧪 开始测试PDF上传功能...');
    
    // 检查是否有可用的PDF文件
    const samplePdf = path.join(__dirname, 'public', 'uploads', 'Git快速入门(1).pdf');
    
    if (!fs.existsSync(samplePdf)) {
      console.log('❌ 找不到测试PDF文件:', samplePdf);
      return;
    }
    
    console.log('📄 使用测试文件:', samplePdf);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(samplePdf));
    formData.append('quality', 'high');
    
    console.log('📤 发送上传请求...');
    
    // 发送请求
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // 模拟已登录用户的session，这里需要从浏览器获取真实的cookie
        'Cookie': 'supabase-auth-token=your-token-here'
      }
    });
    
    console.log('📥 响应状态:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 上传成功!');
      console.log('📊 响应数据:', JSON.stringify(result, null, 2));
      
      if (result.pdf && result.pdf.id) {
        console.log(`🔗 分析页面链接: http://localhost:3000/analysis/${result.pdf.id}`);
      }
    } else {
      const error = await response.text();
      console.log('❌ 上传失败:', error);
    }
    
  } catch (error) {
    console.error('🚨 测试过程中出错:', error);
  }
}

// 检查依赖
try {
  require('form-data');
  require('node-fetch');
} catch (e) {
  console.log('请先安装依赖: npm install form-data node-fetch');
  process.exit(1);
}

testUpload();