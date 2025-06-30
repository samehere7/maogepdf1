const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { default: fetch } = require('node-fetch');

async function testSmallUpload() {
  try {
    console.log('Testing small file upload to test endpoint...');
    
    // 使用小的测试PDF
    const testPdfPath = path.join(__dirname, 'public', 'sample.pdf');
    if (!fs.existsSync(testPdfPath)) {
      console.error('Test PDF not found');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPdfPath));
    
    console.log('Sending request to test endpoint...');
    const response = await fetch('http://localhost:3000/api/test-upload-size', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });
    
    console.log('Response status:', response.status);
    const result = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(result);
      console.log('Test successful!');
      console.log('File:', data.fileName);
      console.log('Size:', data.fileSizeMB + 'MB');
    } else {
      console.log('Test failed');
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// 检查服务器是否运行
fetch('http://localhost:3000')
  .then(() => {
    testSmallUpload();
  })
  .catch(() => {
    console.log('Development server is not running. Please start it first with: npm run dev');
  });