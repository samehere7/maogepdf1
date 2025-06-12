const puppeteer = require('puppeteer');

async function testContextError() {
  console.log('🔍 测试useContext错误...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // 收集控制台错误
    const errors = [];
    page.on('console', msg => {
      const text = msg.text();
      console.log('浏览器控制台:', text);
      if (text.includes('useContext') || text.includes('Context') || text.includes('TypeError')) {
        errors.push(text);
      }
    });
    
    page.on('pageerror', error => {
      console.error('页面错误:', error.message);
      errors.push(error.message);
    });
    
    // 测试主页
    console.log('📄 测试主页...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0', timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (errors.length === 0) {
      console.log('✅ 主页无Context错误');
    } else {
      console.log('❌ 主页发现错误:', errors);
    }
    
    // 清空错误数组
    errors.length = 0;
    
    // 测试分析页面
    console.log('📋 测试分析页面...');
    await page.goto('http://localhost:3001/analysis/67623f86ac2a32dd75ac31b6', { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (errors.length === 0) {
      console.log('✅ 分析页面无Context错误');
    } else {
      console.log('❌ 分析页面发现错误:', errors);
    }
    
    // 截图
    await page.screenshot({ 
      path: 'context-error-test.png', 
      fullPage: true 
    });
    console.log('📸 已保存截图: context-error-test.png');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  testContextError();
}

module.exports = { testContextError };