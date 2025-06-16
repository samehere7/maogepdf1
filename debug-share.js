/**
 * 调试分享功能的脚本
 * 帮助诊断分享链接失败的问题
 */

// 模拟分享链接的生成和解析
function debugShareLink() {
  console.log('🔍 调试分享链接生成和解析...\n');
  
  // 测试数据
  const testPdfId = 'abc123';
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  
  // 生成分享ID（模拟API逻辑）
  const shareId = `${testPdfId}-${timestamp}-${randomId}`;
  console.log('生成的分享ID:', shareId);
  
  // 生成分享URL
  const baseUrl = 'http://localhost:3000';
  const shareUrl = `${baseUrl}/share/${shareId}`;
  console.log('分享URL:', shareUrl);
  
  // 模拟解析逻辑（分享页面逻辑）
  const parts = shareId.split('-');
  const parsedPdfId = parts[0];
  const parsedTimestamp = parseInt(parts[1]);
  const parsedRandomId = parts[2];
  
  console.log('\n解析结果:');
  console.log('- 原始PDF ID:', testPdfId);
  console.log('- 解析PDF ID:', parsedPdfId);
  console.log('- 匹配:', testPdfId === parsedPdfId ? '✅' : '❌');
  console.log('- 时间戳:', new Date(parsedTimestamp).toLocaleString());
  console.log('- 随机ID:', parsedRandomId);
  console.log('- 分段数量:', parts.length);
  
  // 检查格式验证
  const isValidFormat = parts.length >= 2 && parsedPdfId && !isNaN(parsedTimestamp);
  console.log('- 格式有效:', isValidFormat ? '✅' : '❌');
  
  return {
    shareId,
    shareUrl,
    isValid: isValidFormat,
    pdfId: parsedPdfId
  };
}

// 测试不同的分享链接格式
function testShareLinkFormats() {
  console.log('\n🧪 测试各种分享链接格式...\n');
  
  const testCases = [
    'abc123-1234567890-xyz789',      // 正确格式
    'abc123-1234567890',             // 缺少随机ID
    'abc123',                        // 只有PDF ID
    'abc123-1234567890-xyz789-extra',// 额外部分
    '',                              // 空字符串
    'abc-123-xyz-789',               // 包含连字符的ID
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`测试用例 ${index + 1}: "${testCase}"`);
    
    const parts = testCase.split('-');
    const pdfId = parts[0];
    const isValidFormat = parts.length >= 2 && pdfId && parts[1];
    
    console.log(`  - 分段: [${parts.map(p => `"${p}"`).join(', ')}]`);
    console.log(`  - PDF ID: "${pdfId}"`);
    console.log(`  - 有效: ${isValidFormat ? '✅' : '❌'}`);
    
    if (!isValidFormat) {
      console.log(`  - 问题: ${
        !pdfId ? '缺少PDF ID' : 
        parts.length < 2 ? '格式不完整' : 
        '未知问题'
      }`);
    }
    console.log('');
  });
}

// 模拟API调用测试
async function testAPICall(pdfId) {
  console.log(`\n🌐 测试API调用: /api/share/pdf/${pdfId}...\n`);
  
  try {
    // 这里模拟API调用，实际环境中需要真实的fetch请求
    console.log(`模拟API请求: GET /api/share/pdf/${pdfId}`);
    console.log('预期响应格式:');
    console.log(JSON.stringify({
      pdf: {
        id: pdfId,
        name: 'test.pdf',
        url: '/uploads/test.pdf',
        size: 1024000,
        uploadDate: new Date().toISOString(),
        ownerName: '测试用户'
      },
      error: null
    }, null, 2));
    
  } catch (error) {
    console.error('API调用失败:', error);
  }
}

// 检查环境变量和配置
function checkEnvironment() {
  console.log('\n⚙️  检查环境配置...\n');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  console.log('必需的环境变量:');
  requiredEnvVars.forEach(varName => {
    const exists = process.env[varName] ? '✅' : '❌';
    const value = process.env[varName] ? '[已设置]' : '[未设置]';
    console.log(`  - ${varName}: ${exists} ${value}`);
  });
}

// 主函数
function runDiagnostics() {
  console.log('🚀 开始分享功能诊断\n');
  console.log('='.repeat(50));
  
  try {
    // 1. 测试分享链接生成和解析
    const result = debugShareLink();
    
    // 2. 测试各种格式
    testShareLinkFormats();
    
    // 3. 测试API调用
    testAPICall(result.pdfId);
    
    // 4. 检查环境配置
    checkEnvironment();
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 诊断完成！');
    
    if (result.isValid) {
      console.log('\n💡 建议的故障排除步骤:');
      console.log('1. 检查Supabase数据库连接');
      console.log('2. 验证pdfs表中是否存在对应的PDF记录');
      console.log('3. 检查行级安全策略(RLS)是否阻止了访问');
      console.log('4. 确认API路由是否正确实现');
      console.log('5. 查看浏览器控制台和服务器日志中的详细错误');
    }
    
  } catch (error) {
    console.error('❌ 诊断过程中出错:', error);
  }
}

// 如果直接运行此文件，执行诊断
if (require.main === module) {
  runDiagnostics();
}

module.exports = {
  debugShareLink,
  testShareLinkFormats,
  testAPICall,
  checkEnvironment,
  runDiagnostics
};