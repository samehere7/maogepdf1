const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testCompleteFlow() {
  console.log('🚀 开始完整的PDF上传和聊天流程测试...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,  // 显示浏览器界面
      defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // 监听控制台输出
    page.on('console', msg => {
      console.log('浏览器控制台:', msg.text());
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
      console.error('页面错误:', error.message);
    });
    
    console.log('📄 导航到主页...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // 等待页面加载完成
    await page.waitForSelector('.min-h-screen', { timeout: 10000 });
    console.log('✅ 主页加载成功');
    
    // 检查是否有可用的PDF文件
    const samplePdfPath = path.join(__dirname, 'public', 'sample.pdf');
    if (!fs.existsSync(samplePdfPath)) {
      console.log('❌ 未找到示例PDF文件，跳过上传测试');
      return;
    }
    
    // 查找文件上传输入
    console.log('🔍 查找文件上传元素...');
    const fileInput = await page.$('input[type="file"][accept=".pdf"]');
    
    if (!fileInput) {
      console.log('❌ 未找到文件上传输入');
      return;
    }
    
    console.log('📤 开始上传PDF文件...');
    await fileInput.uploadFile(samplePdfPath);
    
    // 等待上传完成和页面跳转
    console.log('⏳ 等待上传完成...');
    try {
      await page.waitForNavigation({ 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
      console.log('✅ 上传成功，已跳转到分析页面');
    } catch (error) {
      console.log('⚠️ 等待页面跳转超时，检查当前URL...');
      const currentUrl = page.url();
      console.log('当前URL:', currentUrl);
      
      if (currentUrl.includes('/analysis/')) {
        console.log('✅ 确认已在分析页面');
      } else {
        console.log('❌ 未跳转到分析页面');
        return;
      }
    }
    
    // 等待页面元素加载
    await page.waitForTimeout(3000);
    
    // 检查是否有错误信息
    const errorElements = await page.$$('.text-red-500, [class*="error"]');
    if (errorElements.length > 0) {
      for (const errorEl of errorElements) {
        const errorText = await page.evaluate(el => el.textContent, errorEl);
        console.log('❌ 发现错误信息:', errorText);
      }
    } else {
      console.log('✅ 未发现明显错误信息');
    }
    
    // 查找并测试聊天功能
    console.log('💬 测试聊天功能...');
    const chatInput = await page.$('input[placeholder*="提问"], input[placeholder*="question"]');
    
    if (chatInput) {
      console.log('✅ 找到聊天输入框');
      
      // 输入测试问题
      await chatInput.type('这个PDF的主要内容是什么？');
      
      // 查找发送按钮
      const sendButton = await page.$('button[class*="Send"], button:has(.lucide-send)');
      if (sendButton) {
        console.log('📨 发送测试问题...');
        await sendButton.click();
        
        // 等待回答
        await page.waitForTimeout(5000);
        console.log('✅ 聊天测试完成');
      } else {
        console.log('❌ 未找到发送按钮');
      }
    } else {
      console.log('❌ 未找到聊天输入框');
    }
    
    // 检查页面最终状态
    const finalUrl = page.url();
    console.log('🎯 最终URL:', finalUrl);
    
    // 截图保存
    await page.screenshot({ 
      path: 'test-result.png', 
      fullPage: true 
    });
    console.log('📸 已保存页面截图: test-result.png');
    
    console.log('🎉 完整流程测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 运行测试
if (require.main === module) {
  testCompleteFlow();
}

module.exports = { testCompleteFlow };