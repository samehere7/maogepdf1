// 简单的浏览器测试脚本，可以在开发者工具的控制台中运行

console.log('🧪 测试侧边栏PDF拖动功能');

// 检查拖动相关的DOM元素
function testDragElements() {
  console.log('\n1. 检查可拖动元素...');
  
  // 查找PDF项目
  const pdfItems = document.querySelectorAll('[draggable="true"]');
  console.log(`找到 ${pdfItems.length} 个可拖动的PDF项目`);
  
  if (pdfItems.length === 0) {
    console.log('❌ 没有找到可拖动的PDF项目');
    return false;
  }
  
  // 检查每个PDF项目是否正确设置了拖动属性
  pdfItems.forEach((item, index) => {
    const isDraggable = item.getAttribute('draggable') === 'true';
    const hasId = item.getAttribute('key') || item.dataset.id;
    console.log(`PDF项目 ${index + 1}: 可拖动=${isDraggable}, 有ID=${!!hasId}`);
  });
  
  return true;
}

// 检查文件夹拖放区域
function testDropZones() {
  console.log('\n2. 检查文件夹拖放区域...');
  
  // 查找文件夹元素
  const folders = document.querySelectorAll('[data-folder-id], .group:has(svg[size="16"])');
  console.log(`找到 ${folders.length} 个文件夹`);
  
  if (folders.length === 0) {
    console.log('❌ 没有找到文件夹拖放区域');
    return false;
  }
  
  return true;
}

// 模拟拖动事件
function simulateDragEvent() {
  console.log('\n3. 模拟拖动事件...');
  
  const pdfItems = document.querySelectorAll('[draggable="true"]');
  const folders = document.querySelectorAll('.group');
  
  if (pdfItems.length === 0 || folders.length === 0) {
    console.log('❌ 没有足够的元素进行拖动测试');
    return false;
  }
  
  const firstPdf = pdfItems[0];
  const firstFolder = folders[0];
  
  try {
    // 创建拖动开始事件
    const dragStartEvent = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer()
    });
    
    console.log('📤 触发拖动开始事件...');
    firstPdf.dispatchEvent(dragStartEvent);
    
    // 创建拖动结束事件
    const dragEndEvent = new DragEvent('dragend', {
      bubbles: true,
      cancelable: true
    });
    
    console.log('📥 触发拖动结束事件...');
    firstPdf.dispatchEvent(dragEndEvent);
    
    console.log('✅ 拖动事件模拟成功');
    return true;
    
  } catch (error) {
    console.log('❌ 拖动事件模拟失败:', error);
    return false;
  }
}

// 检查拖动样式和状态
function testDragStyles() {
  console.log('\n4. 检查拖动样式...');
  
  const pdfItems = document.querySelectorAll('[draggable="true"]');
  
  if (pdfItems.length === 0) {
    console.log('❌ 没有PDF项目可测试');
    return false;
  }
  
  // 检查鼠标样式
  pdfItems.forEach((item, index) => {
    const style = window.getComputedStyle(item);
    const cursor = style.cursor;
    const userSelect = style.userSelect;
    
    console.log(`PDF项目 ${index + 1}: cursor=${cursor}, userSelect=${userSelect}`);
  });
  
  return true;
}

// 检查localStorage中的文件夹结构
function testFolderStructure() {
  console.log('\n5. 检查文件夹结构...');
  
  try {
    const folderStructure = JSON.parse(localStorage.getItem('folderStructure') || '{}');
    const uploadedPdfs = JSON.parse(localStorage.getItem('uploadedPdfs') || '[]');
    const uploadedFolders = JSON.parse(localStorage.getItem('uploadedFolders') || '[]');
    
    console.log('📁 文件夹结构:', folderStructure);
    console.log('📄 PDF列表:', uploadedPdfs.length, '个PDF');
    console.log('📂 文件夹列表:', uploadedFolders.length, '个文件夹');
    
    return true;
  } catch (error) {
    console.log('❌ localStorage读取失败:', error);
    return false;
  }
}

// 运行所有测试
async function runDragTests() {
  console.log('🚀 开始拖动功能测试...\n');
  
  const results = [
    testDragElements(),
    testDropZones(),
    simulateDragEvent(),
    testDragStyles(),
    testFolderStructure()
  ];
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('✅ 所有拖动功能测试通过！');
  } else {
    console.log('⚠️ 部分测试失败，请检查拖动功能实现');
  }
  
  return passedTests === totalTests;
}

// 导出测试函数供外部调用
if (typeof window !== 'undefined') {
  window.testDragFunctionality = runDragTests;
  console.log('💡 拖动功能测试已加载。在浏览器控制台中运行: testDragFunctionality()');
}

// 如果在Node.js环境中，直接运行测试
if (typeof window === 'undefined') {
  console.log('⚠️ 此测试需要在浏览器环境中运行');
}

runDragTests();