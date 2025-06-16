/**
 * 测试分享功能的脚本
 * 运行方式: node test-share.js
 */

// 测试分享链接生成
async function testShareLinkGeneration() {
  console.log('🔗 测试分享链接生成...')
  
  // 模拟生成分享ID
  const pdfId = 'test-pdf-123'
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substr(2, 9)
  const shareId = `${pdfId}-${timestamp}-${randomId}`
  
  console.log('生成的分享ID:', shareId)
  console.log('PDF ID:', shareId.split('-')[0])
  console.log('时间戳:', shareId.split('-')[1])
  console.log('随机字符:', shareId.split('-')[2])
  
  return shareId
}

// 测试分享URL构造
function testShareUrlConstruction(shareId) {
  console.log('🌐 测试分享URL构造...')
  
  const baseUrls = [
    'http://localhost:3000',
    'https://yourapp.com',
    'https://maoge.pdf'
  ]
  
  baseUrls.forEach(baseUrl => {
    const shareUrl = `${baseUrl}/share/${shareId}`
    console.log(`${baseUrl} -> ${shareUrl}`)
  })
}

// 测试分享链接解析
function testShareLinkParsing(shareId) {
  console.log('🔍 测试分享链接解析...')
  
  const parts = shareId.split('-')
  if (parts.length >= 3) {
    const pdfId = parts[0]
    const timestamp = parseInt(parts[1])
    const randomPart = parts[2]
    
    console.log('解析结果:')
    console.log('- PDF ID:', pdfId)
    console.log('- 创建时间:', new Date(timestamp).toLocaleString())
    console.log('- 随机部分:', randomPart)
    
    // 检查链接是否过期（假设30天过期）
    const expirationTime = timestamp + (30 * 24 * 60 * 60 * 1000) // 30天
    const isExpired = Date.now() > expirationTime
    console.log('- 是否过期:', isExpired)
    console.log('- 过期时间:', new Date(expirationTime).toLocaleString())
  } else {
    console.log('❌ 无效的分享ID格式')
  }
}

// 测试复制功能模拟
async function testCopyFunctionality(text) {
  console.log('📋 测试复制功能...')
  
  // 模拟浏览器环境
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    console.log('✅ 支持现代剪贴板API')
  } else {
    console.log('⚠️ 需要使用降级复制方案')
  }
  
  console.log('待复制文本:', text)
  console.log('文本长度:', text.length)
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试分享功能\n')
  
  try {
    // 1. 测试分享链接生成
    const shareId = await testShareLinkGeneration()
    console.log('')
    
    // 2. 测试URL构造
    testShareUrlConstruction(shareId)
    console.log('')
    
    // 3. 测试链接解析
    testShareLinkParsing(shareId)
    console.log('')
    
    // 4. 测试复制功能
    const testUrl = `https://maoge.pdf/share/${shareId}`
    await testCopyFunctionality(testUrl)
    console.log('')
    
    console.log('✅ 所有测试完成')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runTests()
}

module.exports = {
  testShareLinkGeneration,
  testShareUrlConstruction,
  testShareLinkParsing,
  testCopyFunctionality
}