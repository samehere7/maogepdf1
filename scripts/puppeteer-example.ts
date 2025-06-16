import puppeteer from 'puppeteer';

/**
 * 基本的Puppeteer网页抓取示例
 * 此脚本演示了如何:
 * 1. 启动浏览器
 * 2. 打开新页面
 * 3. 导航到目标网站
 * 4. 截图
 * 5. 提取页面内容
 */
async function runPuppeteerExample() {
  console.log('启动Puppeteer示例...');
  
  // 启动浏览器 (使用--no-sandbox参数在某些环境中解决权限问题)
  const browser = await puppeteer.launch({
    headless: true, // 使用无头模式
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // 创建新页面
    const page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewport({ width: 1280, height: 800 });
    
    // 导航到目标网站
    console.log('正在访问网站...');
    await page.goto('https://example.com', {
      waitUntil: 'networkidle2' // 等待网络活动停止
    });
    
    // 截取屏幕截图
    console.log('保存截图...');
    await page.screenshot({ path: 'example-screenshot.png' });
    
    // 获取页面标题
    const title = await page.title();
    console.log('页面标题:', title);
    
    // 提取页面内容
    const content = await page.evaluate(() => {
      // 在浏览器环境中执行的代码
      const heading = document.querySelector('h1')?.textContent || '未找到标题';
      const paragraph = document.querySelector('p')?.textContent || '未找到段落';
      
      return {
        heading,
        paragraph,
        url: window.location.href
      };
    });
    
    console.log('提取的内容:', content);
    
  } catch (error) {
    console.error('运行过程中发生错误:', error);
  } finally {
    // 确保关闭浏览器
    await browser.close();
    console.log('浏览器已关闭。示例完成。');
  }
}

// 执行示例
runPuppeteerExample().catch(console.error);

/**
 * 要运行此示例:
 * 1. 确保已安装Puppeteer: npm install puppeteer
 * 2. 运行: npx ts-node scripts/puppeteer-example.ts
 * 
 * 注意: 如需运行在生产环境,建议添加更多错误处理和重试逻辑
 */
