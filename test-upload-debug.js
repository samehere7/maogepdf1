const puppeteer = require('puppeteer');
const path = require('path');

async function debugUpload() {
  console.log('🚀 开始调试PDF上传流程...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // 监听控制台日志
    page.on('console', msg => {
      console.log(`[浏览器] ${msg.type()}: ${msg.text()}`);
    });
    
    // 监听网络请求
    page.on('response', async response => {
      if (response.url().includes('/api/upload')) {
        console.log(`[上传API] 状态: ${response.status()}`);
        try {
          const responseText = await response.text();
          console.log(`[上传API] 响应:`, responseText);
        } catch (e) {
          console.log(`[上传API] 无法读取响应: ${e.message}`);
        }
      }
    });
    
    console.log('📱 导航到首页...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    console.log('⏰ 等待页面加载完成...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 检查是否需要登录
    try {
      await page.waitForSelector('button', { timeout: 10000 });
      console.log('✅ 页面加载完成');
      
      // 截屏查看当前状态
      await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
      console.log('📸 已保存主页截图: debug-homepage.png');
      
    } catch (e) {
      console.log('⚠️ 页面加载超时');
      throw new Error('页面加载失败');
    }
    
    console.log('📄 准备上传PDF文件...');
    
    // 创建一个测试PDF文件
    const testPdfPath = path.join(__dirname, 'public', 'sample.pdf');
    console.log(`使用测试文件: ${testPdfPath}`);
    
    // 找到文件输入元素
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      console.log('❌ 找不到文件上传输入框');
      await page.screenshot({ path: 'debug-no-input.png', fullPage: true });
      throw new Error('找不到文件上传输入框');
    }
    
    console.log('📤 开始上传文件...');
    await fileInput.uploadFile(testPdfPath);
    
    // 等待上传完成和重定向
    console.log('⏳ 等待上传完成...');
    
    // 监听页面变化
    let navigationSuccess = false;
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        console.log(`🔄 页面导航到: ${frame.url()}`);
        navigationSuccess = true;
      }
    });
    
    try {
      await page.waitForNavigation({ 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
    } catch (navError) {
      console.log('⚠️ 导航超时，检查当前页面状态...');
      await page.screenshot({ path: 'debug-after-upload.png', fullPage: true });
    }
    
    const currentUrl = page.url();
    console.log(`📍 当前页面: ${currentUrl}`);
    
    if (currentUrl.includes('/analysis/')) {
      console.log('✅ 成功跳转到分析页面');
      
      // 检查是否显示错误
      try {
        await page.waitForSelector('text=文件未找到', { timeout: 3000 });
        console.log('❌ 显示"文件未找到"错误');
      } catch (e) {
        console.log('✅ 没有显示错误，PDF加载成功');
      }
    } else {
      console.log('❌ 未能跳转到分析页面');
    }
    
    // 保持浏览器打开以便检查
    console.log('🔍 保持浏览器打开以便检查...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugUpload();
}

module.exports = { debugUpload };