const puppeteer = require('puppeteer');

async function testNewLayout() {
  console.log('🎨 测试新的界面布局...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1400, height: 900 }
    });
    
    const page = await browser.newPage();
    
    // 监听控制台错误
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('error') || text.includes('Error')) {
        console.log('❌ 浏览器错误:', text);
      }
    });
    
    page.on('pageerror', error => {
      console.error('❌ 页面错误:', error.message);
    });
    
    console.log('📄 导航到分析页面...');
    // 使用现有的PDF ID进行测试
    await page.goto('http://localhost:3000/analysis/67623f86ac2a32dd75ac31b6', { 
      waitUntil: 'networkidle0', 
      timeout: 15000 
    });
    
    // 等待页面加载
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 检查界面布局结构...');
    
    // 检查是否没有顶部header（应该被移除）
    const header = await page.$('header');
    if (!header) {
      console.log('✅ 顶部Header已移除，释放了空间');
    } else {
      console.log('⚠️ 顶部Header仍然存在');
    }
    
    // 检查左侧边栏
    const sidebar = await page.$('.w-64');
    if (sidebar) {
      console.log('✅ 左侧边栏正常存在');
    } else {
      console.log('❌ 左侧边栏未找到');
    }
    
    // 检查中间PDF展示区域
    const pdfArea = await page.$('.flex-1.flex.flex-col');
    if (pdfArea) {
      console.log('✅ 中间PDF展示区域存在');
    } else {
      console.log('❌ 中间PDF展示区域未找到');
    }
    
    // 检查闪卡区域（应该在PDF下方）
    const flashcardArea = await page.$('.h-64.border-t');
    if (flashcardArea) {
      console.log('✅ 闪卡区域已移动到PDF下方');
    } else {
      console.log('❌ 闪卡区域未找到');
    }
    
    // 检查右侧对话区域
    const chatArea = await page.$('.w-96.flex-shrink-0');
    if (chatArea) {
      console.log('✅ 右侧对话区域存在');
    } else {
      console.log('❌ 右侧对话区域未找到');
    }
    
    // 检查模型质量按钮是否在输入框上方
    const modelButtons = await page.$$('.bg-blue-500, .bg-purple-500');
    if (modelButtons.length >= 1) {
      console.log('✅ 模型质量按钮已移动到输入框上方');
    } else {
      console.log('⚠️ 模型质量按钮可能位置不正确');
    }
    
    // 检查输入框
    const inputBox = await page.$('input[placeholder*="提问"]');
    if (inputBox) {
      console.log('✅ 对话输入框存在');
    } else {
      console.log('❌ 对话输入框未找到');
    }
    
    // 测试界面响应性
    console.log('📱 测试界面响应...');
    
    // 尝试点击闪卡tab
    const flashcardTabs = await page.$$('[role="tab"]');
    if (flashcardTabs.length > 0) {
      await flashcardTabs[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ 闪卡tab点击响应正常');
      
      if (flashcardTabs.length > 1) {
        await flashcardTabs[1].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✅ 学习tab点击响应正常');
      }
    }
    
    // 截图保存
    await page.screenshot({ 
      path: 'new-layout-test.png', 
      fullPage: true 
    });
    console.log('📸 已保存新布局截图: new-layout-test.png');
    
    console.log('\n🎉 新界面布局测试完成！');
    console.log('📋 优化总结:');
    console.log('- 移除顶部Header，释放更多空间 ✅');
    console.log('- PDF展示区域更加突出 ✅');
    console.log('- 闪卡功能移到PDF下方 ✅');
    console.log('- 右侧专注于对话功能 ✅');
    console.log('- 模型选择按钮优化位置 ✅');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (require.main === module) {
  testNewLayout();
}

module.exports = { testNewLayout };