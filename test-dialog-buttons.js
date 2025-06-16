/**
 * 检查Dialog组件重复关闭按钮的测试脚本
 */

const fs = require('fs');
const path = require('path');

// 检查组件文件中是否存在重复关闭按钮的模式
function checkForDuplicateCloseButtons(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // 检查是否同时包含Dialog和手动添加的X按钮
  const hasDialog = content.includes('Dialog') && content.includes('DialogContent');
  const hasManualXButton = content.includes('<X') || content.includes('X className') || content.includes('X size');
  const hasJustifyBetween = content.includes('justify-between') && content.includes('DialogTitle');
  
  if (hasDialog && hasManualXButton) {
    issues.push(`可能的重复关闭按钮: 同时使用Dialog和手动X按钮`);
  }
  
  if (hasJustifyBetween) {
    issues.push(`可能的重复关闭按钮: DialogTitle中使用justify-between布局`);
  }
  
  // 检查特定的问题模式
  const problemPatterns = [
    /DialogTitle.*justify-between.*X/s,
    /DialogHeader.*flex.*justify-between.*X/s,
    /<X.*onClick.*onClose/s,
    /Button.*X.*onClick.*close/si
  ];
  
  problemPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      issues.push(`匹配问题模式 ${index + 1}: 可能有重复的关闭按钮`);
    }
  });
  
  return issues;
}

// 扫描组件目录
function scanComponentsDirectory() {
  const componentsDir = path.join(__dirname, 'components');
  const results = {};
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const issues = checkForDuplicateCloseButtons(filePath);
        if (issues.length > 0) {
          results[filePath] = issues;
        }
      }
    });
  }
  
  try {
    scanDir(componentsDir);
  } catch (error) {
    console.error('扫描目录时出错:', error.message);
    return {};
  }
  
  return results;
}

// 执行检查
console.log('🔍 检查Dialog组件重复关闭按钮问题...\n');

const results = scanComponentsDirectory();

if (Object.keys(results).length === 0) {
  console.log('✅ 未发现重复关闭按钮问题！');
} else {
  console.log('⚠️  发现以下潜在问题:');
  
  Object.entries(results).forEach(([filePath, issues]) => {
    console.log(`\n📁 ${path.relative(__dirname, filePath)}:`);
    issues.forEach(issue => {
      console.log(`   • ${issue}`);
    });
  });
  
  console.log('\n💡 建议:');
  console.log('   • 移除DialogTitle或DialogHeader中手动添加的关闭按钮');
  console.log('   • 使用Dialog组件自带的默认关闭按钮');
  console.log('   • 避免在DialogTitle中使用justify-between布局来放置关闭按钮');
}

console.log('\n🏁 检查完成！');

// 导出结果供其他脚本使用
module.exports = {
  checkForDuplicateCloseButtons,
  scanComponentsDirectory
};