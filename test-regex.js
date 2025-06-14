/**
 * 正则表达式测试文件
 * 测试正则表达式 /【(\d+)】/g 是否能正确匹配 【数字】 格式
 */

// 测试用的正则表达式
const regex = /【(\d+)】/g;

// 测试字符串集合
const testStrings = [
    "这是一个包含【8】的测试字符串",
    "多个匹配：【12】和【34】还有【567】",
    "混合内容：普通文字【8】更多文字【999】结束",
    "边界测试：【1】【22】【333】【4444】",
    "无匹配的字符串：没有特殊格式",
    "错误格式：[8]和（8）和{8}应该不匹配",
    "空数字测试：【】不应该匹配",
    "包含其他字符：【8a】【b9】【8-9】不应该匹配",
    "正确格式：【0】【123456789】都应该匹配"
];

console.log("=== 正则表达式测试开始 ===");
console.log("测试的正则表达式:", regex.toString());
console.log("预期匹配格式: 【数字】\n");

// 遍历每个测试字符串
testStrings.forEach((testString, index) => {
    console.log(`测试 ${index + 1}:`);
    console.log(`输入: "${testString}"`);
    
    // 重置正则表达式的lastIndex（因为使用了全局标志g）
    regex.lastIndex = 0;
    
    // 使用match方法获取所有匹配
    const matches = testString.match(regex);
    
    if (matches) {
        console.log(`匹配结果: ${matches.length} 个匹配`);
        matches.forEach((match, matchIndex) => {
            console.log(`  匹配 ${matchIndex + 1}: "${match}"`);
        });
        
        // 获取捕获组（数字部分）
        regex.lastIndex = 0;
        let match;
        const capturedNumbers = [];
        while ((match = regex.exec(testString)) !== null) {
            capturedNumbers.push(match[1]); // match[1] 是第一个捕获组
        }
        console.log(`提取的数字: [${capturedNumbers.join(', ')}]`);
    } else {
        console.log("匹配结果: 无匹配");
    }
    
    console.log("---");
});

console.log("=== 测试完成 ===\n");

// 额外的详细测试：逐步分析正则表达式的工作原理
console.log("=== 正则表达式分析 ===");
console.log("正则表达式组成部分:");
console.log("  【 - 匹配中文全角左方括号");
console.log("  (\\d+) - 捕获组，匹配一个或多个数字");
console.log("  】 - 匹配中文全角右方括号");
console.log("  g - 全局标志，查找所有匹配项");

// 验证特定格式
const specificTest = "页面【8】和【12】的内容很重要";
console.log(`\n特定测试: "${specificTest}"`);
regex.lastIndex = 0;
const specificMatches = [...specificTest.matchAll(regex)];
console.log("详细匹配信息:");
specificMatches.forEach((match, index) => {
    console.log(`  匹配 ${index + 1}:`);
    console.log(`    完整匹配: "${match[0]}"`);
    console.log(`    捕获的数字: "${match[1]}"`);
    console.log(`    位置: ${match.index}-${match.index + match[0].length}`);
});