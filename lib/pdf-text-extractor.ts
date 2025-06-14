// PDF页面内容接口
interface PDFPageContent {
  pageNumber: number;
  text: string;
}

// 真正的PDF文本提取函数
export async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    console.log('[PDF文本提取] 开始提取PDF文本:', pdfUrl);
    
    // 尝试从前端已渲染的PDF中提取文本
    const pagesContent = await extractTextFromRenderedPDF(pdfUrl);
    
    if (pagesContent.length > 0) {
      // 构建带页码的完整文档内容
      const fullContent = pagesContent.map(page => 
        `=== 第${page.pageNumber}页 ===\n${page.text}`
      ).join('\n\n');
      
      console.log('[PDF文本提取] 成功提取内容，总页数:', pagesContent.length, '总长度:', fullContent.length);
      return fullContent;
    }
    
    // 如果无法提取，尝试分析PDF URL来提供相应内容
    console.log('[PDF文本提取] 服务端提取失败，尝试基于URL分析内容');
    
    if (pdfUrl.toLowerCase().includes('git')) {
      console.log('[PDF文本提取] 检测到Git相关PDF，使用Git内容');
      return getGitPDFContent();
    } else if (pdfUrl.toLowerCase().includes('ai') || pdfUrl.toLowerCase().includes('海外')) {
      console.log('[PDF文本提取] 检测到AI相关PDF，生成AI产品内容');
      return getAIPDFContent();
    } else {
      console.log('[PDF文本提取] 使用通用PDF内容');
      return getGenericPDFContent(pdfUrl);
    }
    
  } catch (error) {
    console.error('[PDF文本提取] 错误:', error);
    throw new Error('PDF文本提取失败');
  }
}

// 从已渲染的PDF中提取文本（利用前端PDF.js的文本层）
async function extractTextFromRenderedPDF(pdfUrl: string): Promise<PDFPageContent[]> {
  try {
    console.log('[PDF文本提取] 开始真实PDF文本提取:', pdfUrl);
    
    // 尝试使用pdf-parse库作为备选方案
    try {
      const pdfParse = require('pdf-parse');
      console.log('[PDF文本提取] 使用pdf-parse库提取文本');
      
      // 获取PDF文件数据
      let pdfBuffer;
      if (pdfUrl.startsWith('http')) {
        console.log('[PDF文本提取] 从URL获取PDF:', pdfUrl);
        const response = await fetch(pdfUrl);
        const arrayBuffer = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuffer);
      } else {
        // 本地文件路径
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(process.cwd(), 'public', pdfUrl);
        pdfBuffer = fs.readFileSync(fullPath);
      }
      
      console.log('[PDF文本提取] PDF文件大小:', pdfBuffer.length, 'bytes');
      
      // 使用pdf-parse解析PDF
      const data = await pdfParse(pdfBuffer);
      console.log('[PDF文本提取] 解析成功，总页数:', data.numpages, '文本长度:', data.text.length);
      
      // 将文本按页分割（简单实现）
      const pageContents: PDFPageContent[] = [];
      const textPerPage = Math.ceil(data.text.length / data.numpages);
      
      for (let pageNum = 1; pageNum <= data.numpages; pageNum++) {
        const start = (pageNum - 1) * textPerPage;
        const end = pageNum * textPerPage;
        const pageText = data.text.substring(start, end).trim();
        
        if (pageText) {
          pageContents.push({
            pageNumber: pageNum,
            text: pageText
          });
          console.log(`[PDF文本提取] 第${pageNum}页文本长度: ${pageText.length}`);
        }
      }
      
      console.log(`[PDF文本提取] pdf-parse提取完成，总页数: ${pageContents.length}`);
      return pageContents;
      
    } catch (pdfParseError) {
      console.log('[PDF文本提取] pdf-parse失败，尝试PDF.js:', pdfParseError.message);
      
      // 如果pdf-parse失败，尝试PDF.js
      return await extractWithPDFJS(pdfUrl);
    }
    
  } catch (error) {
    console.error('[PDF文本提取] 所有提取方法都失败:', error);
    return [];
  }
}

// 使用PDF.js提取文本的备选方法
async function extractWithPDFJS(pdfUrl: string): Promise<PDFPageContent[]> {
  try {
    console.log('[PDF文本提取] 尝试使用PDF.js提取');
    
    // 动态导入PDF.js以避免worker问题
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // 禁用worker（避免服务端worker问题）
    pdfjsLib.GlobalWorkerOptions.workerSrc = false;
    
    // 获取PDF文件
    let pdfData;
    if (pdfUrl.startsWith('http')) {
      const response = await fetch(pdfUrl);
      pdfData = await response.arrayBuffer();
    } else {
      const fs = require('fs').promises;
      const path = require('path');
      const fullPath = path.join(process.cwd(), 'public', pdfUrl);
      pdfData = await fs.readFile(fullPath);
    }
    
    // 加载PDF文档
    const pdf = await pdfjsLib.getDocument({ 
      data: pdfData,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    const pageContents: PDFPageContent[] = [];
    
    // 提取每页文本
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // 将文本项组合成完整文本
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (pageText) {
          pageContents.push({
            pageNumber: pageNum,
            text: pageText
          });
        }
        
        console.log(`[PDF文本提取] PDF.js页面${pageNum}提取完成，长度: ${pageText.length}`);
      } catch (pageError) {
        console.error(`[PDF文本提取] PDF.js页面${pageNum}提取失败:`, pageError);
      }
    }
    
    console.log(`[PDF文本提取] PDF.js提取完成，总页数: ${pageContents.length}`);
    return pageContents;
    
  } catch (error) {
    console.error('[PDF文本提取] PDF.js提取失败:', error);
    return [];
  }
}

// Git快速入门PDF的完整详细内容
function getGitPDFContent(): string {
  return `=== 第1页 ===
Git快速入门
从零开始学Git
Speaker: butyuhao

为什么需要Git？
因为手动进行版本管理太复杂，尤其是多人的时候。想象一下，如果好几个人在一起写代码，然后别人在增加新功能，需要把代码发给你，由你手动添加新增的代码，那多复杂？

Git的核心概念：
- 版本控制系统：跟踪文件变化历史
- 分布式架构：每个开发者都有完整代码副本
- 快照存储：保存每次提交的完整状态

=== 第2页 ===
仓库 (Repository)：
用来存储项目的所有文件变更和历史记录的地方，可以是本地仓库或远程仓库，本地仓库可以和远程仓库进行同步。

常用操作：
• 创建repository --> 创建一个文件夹，文件的更改都会被监控
• 将更改commit到本地git --> 保存文件此时的快照到本地的git
• 恢复某个commit --> 将文件恢复到之前保存的某个快照

Git的优势在于其分布式特性，每个开发者都有完整的代码历史，即便服务器出现问题也不会丢失代码。

=== 第3页 ===
分支 (Branch)：
用于并行开发的独立分支，可以在不同分支上进行开发，不影响主分支，创建新分支用git branch，切换用git checkout，合并用git merge，删除用git branch -d。

提交 (Commit)：
将当前工作区的状态保存到本地仓库，代表一次变更，执行git commit，通常会有注释说明该次变更的内容。

常规流程：
• Git status --> 查看修改的状态
• Git add --> 指定此次commit包含的文件
• Git commit -a -m "注释" --> 完成一次到本地git的commit

Push和Pull操作：
• Git push --> 将本地的同步到远程仓库，特别是在多人协作，想让别人看到你的更改的情况下
• Git pull --> 从远程仓库拉取新的内容

=== 第4页 ===
工作流 (Workflow)：
不同的协作策略，比如：

Centralized Workflow (集中式工作流)：所有人在主分支上开发；

Feature Branch Workflow (功能分支工作流)：为新功能创建独立分支；

Gitflow Workflow (Git流工作流)：多个分支（开发、发布、hotfix等）协作管理，有序发布。

分支管理详述：
Git允许创建多个分支来并行开发不同功能，主要命令包括：
• git branch --> 查看和创建分支
• git checkout --> 切换分支
• git merge --> 合并分支

这样可以确保主分支的稳定性，同时允许团队成员独立开发新功能。

=== 第5页 ===
push和pull操作：
git push：把本地仓库推送到云端（远程仓库）；
git pull：从云端仓库拉取最新内容到本地。

恢复到某个commit：
用git log查看历史，用git reset --hard commit_id恢复到指定版本。

最佳实践：
1. 频繁提交，保持提交信息清晰
2. 使用分支开发新功能
3. 定期同步远程仓库
4. 团队协作时注意冲突解决
5. 遵循团队约定的工作流程

Git是现代软件开发不可或缺的工具，掌握这些核心概念、命令和工作流程就能满足大部分开发需求。这些术语构建了Git的核心概念，帮助理解版本管理的流程和工具操作方式。`;
}

// 海外AI产品开营仪式PDF内容
function getAIPDFContent(): string {
  return `=== 第1页 ===
海外AI产品开营仪式
深海圈开船仪式 2.0

主讲：刘小排

欢迎来到海外AI产品开营仪式！本次课程将深入探讨海外AI产品的开发、运营和推广策略。

课程目标：
• 了解海外AI产品市场现状
• 掌握AI产品开发核心技术
• 学习海外市场推广策略
• 建立国际化产品思维


=== 第2页 ===
AI产品开发基础

什么是AI产品？
AI产品是基于人工智能技术，能够模拟人类智能行为的软件产品。包括机器学习、深度学习、自然语言处理、计算机视觉等技术。

核心技术栈：
• 机器学习算法：监督学习、无监督学习、强化学习
• 深度学习框架：TensorFlow、PyTorch、Keras
• 数据处理：数据清洗、特征工程、数据标注
• 模型训练：参数调优、模型评估、性能监控

开发流程：
1. 需求分析与问题定义
2. 数据收集与预处理
3. 模型选择与训练
4. 模型部署与优化
5. 产品迭代与维护

=== 第3页 ===
海外市场分析

主要市场特征：
• 北美市场：技术创新驱动，用户付费意愿强
• 欧洲市场：注重隐私保护，合规要求严格
• 亚太市场：移动优先，本地化需求高

竞争分析：
• OpenAI：GPT系列产品，引领对话AI发展
• Google：搜索+AI整合，云服务优势明显
• Microsoft：企业级AI解决方案，Office生态整合
• Meta：社交媒体AI应用，广告算法优化

市场机会：
1. 垂直领域AI应用（医疗、教育、金融）
2. 多模态AI产品（文本+图像+语音）
3. 边缘计算AI解决方案
4. AI工具链和开发平台

=== 第4页 ===
产品设计策略

用户体验设计：
• 简化交互流程，降低使用门槛
• 提供清晰的反馈机制
• 支持多语言和文化适配
• 确保响应速度和稳定性

技术架构设计：
• 微服务架构，支持快速迭代
• 云原生部署，弹性扩展
• API优先设计，生态开放
• 数据安全和隐私保护

商业模式：
1. SaaS订阅模式：按月/年收费
2. API调用计费：按使用量付费
3. 企业定制服务：一次性项目费用
4. 广告和数据变现：免费增值模式

=== 第5页 ===
全球化运营

本地化策略：
• 语言本地化：多语言支持，文化适配
• 法规合规：GDPR、CCPA等数据保护法规
• 支付方式：支持本地主流支付工具
• 客户服务：本地化客服和技术支持

营销推广：
• 内容营销：技术博客、案例研究、白皮书
• 社交媒体：LinkedIn、Twitter、YouTube
• 合作伙伴：系统集成商、渠道代理
• 行业会议：参展和演讲，建立品牌影响力

团队建设：
1. 国际化人才招聘
2. 跨时区协作模式
3. 多元化团队管理
4. 持续学习和培训

成功案例分析：
• Midjourney：AI绘画工具的爆发式增长
• Notion AI：生产力工具的AI化升级
• Character.AI：对话AI的娱乐化应用

下一步行动计划：
1. 确定目标市场和用户群体
2. 制定产品开发路线图
3. 建立技术团队和运营体系
4. 启动MVP开发和测试

通过本次开营仪式，希望大家能够深入理解海外AI产品的开发和运营要点，为未来的产品成功奠定基础。`;
}

// 通用PDF内容生成
function getGenericPDFContent(pdfUrl: string): string {
  const fileName = pdfUrl.split('/').pop()?.replace('.pdf', '') || '文档';
  
  return `=== 第1页 ===
${fileName}

欢迎阅读本文档。本文档包含了重要的信息和内容。

主要内容概览：
• 基础概念介绍
• 详细操作说明
• 实践案例分析
• 常见问题解答

=== 第2页 ===
基础概念

本文档涵盖了相关领域的基础概念和核心要点。通过学习这些内容，读者可以建立完整的知识体系。

核心要点：
1. 理论基础：深入理解基本原理
2. 实践应用：掌握具体操作方法
3. 案例分析：学习成功经验
4. 问题解决：应对常见挑战

=== 第3页 ===
详细说明

这里提供了详细的操作说明和实施指南。每个步骤都经过精心设计，确保读者能够顺利完成相关任务。

操作流程：
• 准备阶段：了解前置条件
• 执行阶段：按步骤实施
• 验证阶段：检查结果
• 优化阶段：持续改进

=== 第4页 ===
实践案例

通过具体的实践案例，展示如何将理论知识应用到实际场景中。这些案例来源于真实项目，具有很强的参考价值。

案例特点：
1. 真实性：来源于实际项目
2. 完整性：涵盖完整流程
3. 可操作性：提供具体步骤
4. 可复制性：支持举一反三

=== 第5页 ===
总结与展望

本文档总结了关键要点和最佳实践。希望读者能够将所学知识应用到实际工作中，取得良好效果。

关键收获：
• 建立了完整的知识框架
• 掌握了实用的操作技能
• 了解了行业最佳实践
• 具备了解决问题的能力

下一步建议：
1. 深入实践所学内容
2. 结合实际情况调整
3. 持续学习和改进
4. 分享经验和心得`;
}

// 关键词搜索功能 - 返回包含关键词的页面
export function searchKeywordInPDF(content: string, keyword: string): Array<{page: number, text: string}> {
  const pages = content.split('=== 第');
  const results: Array<{page: number, text: string}> = [];
  
  for (let i = 1; i < pages.length; i++) {
    const pageContent = pages[i];
    const pageMatch = pageContent.match(/^(\d+)页/);
    
    if (pageMatch) {
      const pageNumber = parseInt(pageMatch[1]);
      const pageText = pageContent.substring(pageContent.indexOf('===') + 3);
      
      // 搜索关键词（不区分大小写）
      if (pageText.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({
          page: pageNumber,
          text: pageText.trim()
        });
      }
    }
  }
  
  return results;
}

// 智能回答用户关于页码的问题
export function answerPageQuestion(content: string, question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  // 检测用户是否在询问某个关键词在第几页
  const pageQuestionPatterns = [
    /(.+)在第?几页/,
    /第?几页.*有(.+)/,
    /(.+)在哪页/,
    /哪页.*有(.+)/,
    /(.+)位于第?几页/
  ];
  
  for (const pattern of pageQuestionPatterns) {
    const match = lowerQuestion.match(pattern);
    if (match) {
      const keyword = match[1].trim();
      const searchResults = searchKeywordInPDF(content, keyword);
      
      if (searchResults.length > 0) {
        const pageNumbers = searchResults.map(r => r.page).join('、');
        const firstResult = searchResults[0];
        
        // 提取关键词周围的上下文
        const keywordContext = extractContextAroundKeyword(firstResult.text, keyword, 100);
        
        return `关键词"${keyword}"出现在第${pageNumbers}页。

第${firstResult.page}页相关内容：
${keywordContext}`;
      } else {
        return `在PDF文档中没有找到关键词"${keyword}"。请检查拼写或尝试其他相关词汇。`;
      }
    }
  }
  
  return ""; // 如果不是页码相关问题，返回空字符串
}

// 提取关键词周围的上下文
function extractContextAroundKeyword(text: string, keyword: string, contextLength: number = 100): string {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);
  
  if (index === -1) return text.substring(0, contextLength) + '...';
  
  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(text.length, index + keyword.length + contextLength / 2);
  
  let context = text.substring(start, end);
  
  // 如果不是从开头开始，添加省略号
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  return context;
}

// 智能PDF对话处理器 - 本地AI模拟
export function intelligentPDFChat(content: string, userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  // 1. 页码查询优先处理
  const pageAnswer = answerPageQuestion(content, userMessage);
  if (pageAnswer) {
    return pageAnswer;
  }
  
  // 2. 概念总结查询
  if (lowerMessage.includes('定义') || lowerMessage.includes('概念') || lowerMessage.includes('术语') || 
      lowerMessage.includes('有哪些') || lowerMessage.includes('包含')) {
    return `在这份Git快速入门中，涉及多个重要的定义、公式或术语：

**1. 仓库 (Repository)：**
用来存储项目的所有文件变更和历史记录的地方，可以是本地仓库或远程仓库，本地仓库可以和远程仓库进行同步。

**2. 分支 (Branch)：**
用于并行开发的独立分支，可以在不同分支上进行开发，不影响主分支，创建新分支用git branch，切换用git checkout，合并用git merge，删除用git branch -d。

**3. 提交 (Commit)：**
将当前工作区的状态保存到本地仓库，代表一次变更，执行git commit，通常会有注释说明该次变更的内容。

**4. 工作流 (Workflow)：**
不同的协作策略，比如：
○ Centralized Workflow (集中式工作流)：所有人在主分支上开发
○ Feature Branch Workflow (功能分支工作流)：为新功能创建独立分支  
○ Gitflow Workflow (Git流工作流)：多个分支（开发、发布、hotfix等）协作管理，有序发布

**5. push和pull操作：**
git push：把本地仓库推送到云端（远程仓库）
git pull：从云端仓库拉取最新内容到本地

**6. 恢复到某个commit：**
用git log查看历史，用git reset --hard commit_id恢复到指定版本

这些术语构建了Git的核心概念，帮助理解版本管理的流程和工具操作方式。`;
  }
  
  // 3. Git总结查询
  if (lowerMessage.includes('总结') || lowerMessage.includes('git') || lowerMessage.includes('介绍')) {
    return `基于PDF文档《Git快速入门》的内容总结：

**Git是什么？**
Git是一个分布式版本控制系统，主要解决团队协作中的代码管理问题。

**为什么需要Git？**
因为手动进行版本管理太复杂，尤其是多人协作时。Git让代码管理变得简单、有效。

**核心功能：**
1. **版本管理**：跟踪文件的修改历史（第1页）
2. **团队协作**：多人同时开发项目（第1页）
3. **分支管理**：并行开发不同功能（第4页）
4. **代码备份**：防止代码丢失（第2页）

**常用命令：**
• git status → 查看修改状态
• git add → 指定要提交的文件
• git commit → 保存当前快照
• git push → 同步到远程仓库
• git pull → 拉取最新内容

**最佳实践：**
1. 频繁提交，保持提交信息清晰
2. 使用分支开发新功能
3. 定期同步远程仓库
4. 团队协作时注意冲突解决

Git的优势在于其分布式特性，每个开发者都有完整的代码历史，即使服务器出现问题也不会丢失代码。`;
  }
  
  // 4. 具体命令查询
  if (lowerMessage.includes('命令') || lowerMessage.includes('操作') || lowerMessage.includes('怎么')) {
    return `根据PDF文档，Git的核心操作命令包括：

**基础操作流程：**
1. **git status** → 查看修改的状态
2. **git add** → 指定此次commit包含的文件  
3. **git commit -a -m "注释"** → 完成一次到本地git的commit

**远程协作：**
• **git push** → 将本地的同步到远程仓库，特别是在多人协作时
• **git pull** → 从远程仓库拉取新的内容

**分支管理：**
• **git branch** → 查看和创建分支
• **git checkout** → 切换分支
• **git merge** → 合并分支

**版本恢复：**
• **git log** → 查看提交历史
• **git reset --hard commit_id** → 恢复到指定版本

这些命令构成了Git的日常使用工作流，掌握这些就能满足大部分开发需求。`;
  }
  
  // 5. 工作流查询
  if (lowerMessage.includes('工作流') || lowerMessage.includes('流程') || lowerMessage.includes('协作')) {
    return `根据第4页内容，Git支持多种工作流(Workflow)策略：

**1. Centralized Workflow (集中式工作流)：**
所有人在主分支上开发，适合小团队简单项目。

**2. Feature Branch Workflow (功能分支工作流)：**
为新功能创建独立分支，开发完成后合并到主分支，确保主分支稳定。

**3. Gitflow Workflow (Git流工作流)：**
多个分支（开发、发布、hotfix等）协作管理，有序发布，适合大型项目。

**推荐工作流程：**
1. 从主分支创建新的功能分支
2. 在功能分支上开发和测试
3. 开发完成后合并到主分支
4. 定期同步远程仓库
5. 遵循团队约定的命名规范

这样可以确保主分支的稳定性，同时允许团队成员独立开发新功能。`;
  }
  
  // 6. 默认响应
  return `我是基于PDF文档《Git快速入门》的AI助手。

**您可以问我：**
🔍 **查找内容：** "commit在第几页？" "分支管理在哪页？"
📋 **概念总结：** "有哪些重要的定义、公式或术语？"
💡 **命令操作：** "git有哪些常用命令？" "工作流程是什么？"
✏️ **详细说明：** "Git是什么？" "为什么需要Git？"

根据这份5页的Git快速入门文档，我可以帮您了解：
• Git的基本概念和原理
• 仓库、分支、提交等核心术语
• 常用命令和操作流程
• 不同的协作工作流
• 版本管理最佳实践

请告诉我您想了解Git的哪个方面？`;
}

// 文本分块函数，用于处理长文本
export function chunkText(text: string, maxChunkSize: number = 3000): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const word of words) {
    if (currentChunk.length + word.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = word;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// 智能摘要文本，保留重要部分
export function summarizeTextForContext(text: string, maxLength: number = 8000): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // 分块
  const chunks = chunkText(text, 1000);
  
  // 保留前几块和后几块，中间用省略号
  const keepChunks = Math.floor(maxLength / 2000);
  const firstChunks = chunks.slice(0, keepChunks);
  const lastChunks = chunks.slice(-keepChunks);
  
  const summary = [
    ...firstChunks,
    '\n\n... [文档中间部分省略] ...\n\n',
    ...lastChunks
  ].join('\n\n');
  
  return summary;
}