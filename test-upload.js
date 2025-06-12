const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testPDFUpload() {
  let browser;
  
  try {
    console.log('启动浏览器...');
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true
    });
    
    const page = await browser.newPage();
    
    // 监听控制台输出
    page.on('console', msg => {
      console.log(`[浏览器] ${msg.type()}: ${msg.text()}`);
    });
    
    // 监听网络请求
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`[网络] ${response.status()} ${response.url()}`);
      }
    });
    
    console.log('访问首页...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    console.log('等待登录或上传按钮...');
    
    // 等待页面加载，查找登录按钮或上传区域
    try {
      await page.waitForSelector('input[type="file"], [data-testid="login-button"], .upload-area', { timeout: 5000 });
    } catch (e) {
      console.log('页面加载可能有问题，继续尝试...');
    }
    
    // 检查是否需要登录
    const needsLogin = await page.$('[data-testid="login-button"]') !== null;
    
    if (needsLogin) {
      console.log('需要登录，点击登录按钮...');
      await page.click('[data-testid="login-button"]');
      
      // 等待Google登录完成 (这里需要手动操作)
      console.log('请手动完成Google登录，然后脚本将继续...');
      
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
    }
    
    // 查找文件输入元素
    console.log('查找文件上传输入...');
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    
    // 选择示例PDF文件
    const pdfPath = path.join(__dirname, 'public', 'sample.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.log('示例PDF不存在，创建一个测试文件...');
      // 这里应该使用现有的PDF文件
      const existingPdf = path.join(__dirname, 'public', 'uploads', 'Git快速入门(1).pdf');
      if (fs.existsSync(existingPdf)) {
        fs.copyFileSync(existingPdf, pdfPath);
      } else {
        throw new Error('没有找到可用的PDF文件进行测试');
      }
    }
    
    console.log('上传PDF文件:', pdfPath);
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(pdfPath);
    
    // 等待上传完成和页面跳转
    console.log('等待上传完成...');
    
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      console.log('✅ 上传成功，页面已跳转');
      
      // 检查是否成功跳转到分析页面
      const currentUrl = page.url();
      if (currentUrl.includes('/analysis/')) {
        console.log('✅ 成功跳转到分析页面:', currentUrl);
        
        // 等待PDF查看器加载
        console.log('等待PDF查看器加载...');
        await page.waitForSelector('.react-pdf__Page', { timeout: 15000 });
        console.log('✅ PDF查看器加载成功');
        
        // 测试聊天功能
        console.log('测试聊天功能...');
        await page.waitForSelector('input[placeholder*="提问"]', { timeout: 5000 });
        
        await page.type('input[placeholder*="提问"]', '这个文档讲的是什么？');
        await page.click('button[type="submit"], button[aria-label*="发送"]');
        
        console.log('✅ 聊天功能测试完成');
        
      } else {
        console.log('❌ 未能跳转到分析页面，当前URL:', currentUrl);
      }
      
    } catch (uploadError) {
      console.log('❌ 上传失败或超时:', uploadError.message);
      
      // 检查是否有错误消息
      const errorMessage = await page.$eval('.error, .alert, [role="alert"]', el => el.textContent).catch(() => null);
      if (errorMessage) {
        console.log('错误消息:', errorMessage);
      }
    }
    
    // 保持浏览器打开一段时间以便观察
    console.log('保持浏览器打开5秒以便观察...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 检查依赖
try {
  require('puppeteer');
  console.log('Puppeteer 已安装');
} catch (e) {
  console.log('请先安装 Puppeteer: npm install puppeteer');
  process.exit(1);
}

testPDFUpload().then(() => {
  console.log('测试完成');
}).catch(console.error);