const fs = require('fs');
const path = require('path');

// 检查测试PDF文件的大小
const testPdfPath = path.join(__dirname, 'public', 'sample.pdf');

if (fs.existsSync(testPdfPath)) {
  const stats = fs.statSync(testPdfPath);
  const fileSizeInBytes = stats.size;
  const fileSizeInKB = fileSizeInBytes / 1024;
  const fileSizeInMB = fileSizeInKB / 1024;
  
  console.log('Test PDF file info:');
  console.log('- Path:', testPdfPath);
  console.log('- Size in bytes:', fileSizeInBytes);
  console.log('- Size in KB:', Math.round(fileSizeInKB * 100) / 100);
  console.log('- Size in MB:', Math.round(fileSizeInMB * 100) / 100);
  
  // 检查是否超过限制
  const maxFreeSize = 10 * 1024 * 1024; // 10MB
  const maxServerSize = 50 * 1024 * 1024; // 50MB
  
  console.log('\nSize limits:');
  console.log('- Free user limit (10MB):', fileSizeInBytes <= maxFreeSize ? 'PASS' : 'FAIL');
  console.log('- Server limit (50MB):', fileSizeInBytes <= maxServerSize ? 'PASS' : 'FAIL');
  
  if (fileSizeInMB > 10) {
    console.log('\n⚠️  File is larger than 10MB - this might cause 413 errors for free users');
  }
  
  if (fileSizeInMB > 50) {
    console.log('\n❌ File is larger than 50MB - this will definitely cause 413 errors');
  }
  
} else {
  console.log('Test PDF file not found at:', testPdfPath);
  
  // 列出public目录的内容
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    console.log('\nFiles in public directory:');
    const files = fs.readdirSync(publicDir);
    files.forEach(file => {
      const filePath = path.join(publicDir, file);
      const stats = fs.statSync(filePath);
      if (file.toLowerCase().endsWith('.pdf')) {
        const sizeInMB = Math.round((stats.size / 1024 / 1024) * 100) / 100;
        console.log(`- ${file}: ${sizeInMB}MB`);
      }
    });
  }
}