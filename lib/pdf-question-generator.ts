/**
 * PDF智能问题生成器
 * 基于PDF内容分析生成相关推荐问题
 */

interface GeneratedQuestion {
  id: string;
  text: string;
  icon: string;
  category: 'summary' | 'concept' | 'process' | 'comparison' | 'application';
}

interface DocumentAnalysis {
  title: string;
  keywords: string[];
  documentType: 'technical' | 'academic' | 'tutorial' | 'guide' | 'manual' | 'general';
  mainTopics: string[];
  hasSteps: boolean;
  hasComparisons: boolean;
  language: 'zh' | 'en' | 'mixed';
}

/**
 * 分析PDF内容，提取关键信息
 */
export function analyzeDocumentContent(content: string, fileName: string): DocumentAnalysis {
  const lowerContent = content.toLowerCase();
  const zhContent = content;
  
  // 检测语言
  const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishChars = (content.match(/[a-zA-Z]/g) || []).length;
  const total = chineseChars + englishChars;
  let language: 'zh' | 'en' | 'mixed' = 'mixed';
  if (total > 0) {
    const chineseRatio = chineseChars / total;
    if (chineseRatio > 0.8) language = 'zh';
    else if (chineseRatio < 0.2) language = 'en';
  }
  
  // 提取关键词
  const keywords: string[] = [];
  
  // 中文关键词提取
  if (language === 'zh' || language === 'mixed') {
    const zhKeywords = extractChineseKeywords(zhContent);
    keywords.push(...zhKeywords);
  }
  
  // 英文关键词提取
  if (language === 'en' || language === 'mixed') {
    const enKeywords = extractEnglishKeywords(lowerContent);
    keywords.push(...enKeywords);
  }
  
  // 文档类型检测
  let documentType: DocumentAnalysis['documentType'] = 'general';
  
  const typePatterns = {
    tutorial: /教程|入门|指南|tutorial|guide|getting started|how to/i,
    technical: /api|技术|函数|方法|algorithm|function|method|technical/i,
    academic: /研究|论文|学术|research|paper|study|academic/i,
    manual: /手册|说明书|用户指南|manual|documentation|user guide/i,
    guide: /指南|指导|guide|instruction|handbook/i
  };
  
  for (const [type, pattern] of Object.entries(typePatterns)) {
    if (pattern.test(content)) {
      documentType = type as DocumentAnalysis['documentType'];
      break;
    }
  }
  
  // 检测主要主题
  const mainTopics = extractMainTopics(content, keywords);
  
  // 检测是否包含步骤
  const hasSteps = /步骤|第.*步|step \d+|步骤 \d+|\d+\.|first|second|third|然后|接下来|最后/i.test(content);
  
  // 检测是否包含对比
  const hasComparisons = /区别|对比|比较|不同|相同|difference|comparison|versus|vs|compare/i.test(content);
  
  return {
    title: fileName.replace('.pdf', ''),
    keywords: keywords.slice(0, 10), // 取前10个关键词
    documentType,
    mainTopics,
    hasSteps,
    hasComparisons,
    language
  };
}

/**
 * 提取中文关键词
 */
function extractChineseKeywords(content: string): string[] {
  const keywords = new Set<string>();
  
  // 常见技术关键词
  const techKeywords = [
    'Git', 'JavaScript', 'Python', 'React', 'Node.js', 'API', 'HTTP', 'CSS', 'HTML',
    '数据库', '算法', '框架', '架构', '设计模式', '开发', '编程', '代码', '函数', '变量',
    '分支', '提交', '合并', '仓库', '版本控制', '部署', '测试', '调试', '优化'
  ];
  
  // 查找技术关键词
  techKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      keywords.add(keyword);
    }
  });
  
  // 提取2-4字的中文词汇
  const chineseWords = content.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  const wordCount = new Map<string, number>();
  
  chineseWords.forEach(word => {
    // 过滤常见词汇
    if (!isCommonWord(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });
  
  // 按频率排序，取高频词
  const sortedWords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
  
  sortedWords.forEach(word => keywords.add(word));
  
  return Array.from(keywords);
}

/**
 * 提取英文关键词
 */
function extractEnglishKeywords(content: string): string[] {
  const keywords = new Set<string>();
  
  // 常见技术关键词
  const techKeywords = [
    'git', 'branch', 'commit', 'merge', 'repository', 'workflow', 'api', 'function',
    'method', 'class', 'object', 'variable', 'algorithm', 'database', 'framework',
    'library', 'development', 'programming', 'code', 'deployment', 'testing'
  ];
  
  techKeywords.forEach(keyword => {
    if (content.includes(keyword)) {
      keywords.add(keyword);
    }
  });
  
  // 提取3-8字母的英文单词
  const englishWords = content.match(/\b[a-z]{3,8}\b/g) || [];
  const wordCount = new Map<string, number>();
  
  englishWords.forEach(word => {
    if (!isCommonEnglishWord(word)) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }
  });
  
  // 按频率排序
  const sortedWords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  sortedWords.forEach(word => keywords.add(word));
  
  return Array.from(keywords);
}

/**
 * 提取主要主题
 */
function extractMainTopics(content: string, keywords: string[]): string[] {
  const topics = new Set<string>();
  
  // 基于关键词组合生成主题
  const topicKeywords = keywords.slice(0, 5);
  
  // 查找标题和章节
  const titleMatches = content.match(/^.{1,50}$/gm) || [];
  titleMatches.forEach(title => {
    if (title.length > 5 && title.length < 50) {
      const cleanTitle = title.trim();
      if (cleanTitle && !cleanTitle.match(/^\d+$/) && !cleanTitle.match(/^第\d+页$/)) {
        topics.add(cleanTitle);
      }
    }
  });
  
  return Array.from(topics).slice(0, 5);
}

/**
 * 检查是否为常见中文词汇
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    '这个', '那个', '可以', '需要', '如果', '因为', '所以', '但是', '然后', '现在',
    '时候', '地方', '问题', '方法', '情况', '内容', '系统', '文件', '用户', '使用',
    '进行', '实现', '操作', '功能', '通过', '在于', '对于', '关于', '由于', '基于'
  ];
  return commonWords.includes(word);
}

/**
 * 检查是否为常见英文词汇
 */
function isCommonEnglishWord(word: string): boolean {
  const commonWords = [
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was',
    'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now',
    'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she',
    'too', 'use', 'this', 'that', 'with', 'have', 'from', 'they', 'know', 'want', 'been',
    'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like',
    'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were'
  ];
  return commonWords.includes(word);
}

/**
 * 生成通用引导问题（不再基于文档分析）
 */
export function generateRecommendedQuestions(analysis: DocumentAnalysis): GeneratedQuestion[] {
  const { language } = analysis;
  
  // 通用引导问题模板
  const universalQuestions = {
    zh: [
      {
        id: 'q1',
        text: '总结本PDF的主要内容',
        icon: '📋',
        category: 'summary' as const
      },
      {
        id: 'q2',
        text: '列出文档中的关键概念或术语',
        icon: '💡',
        category: 'concept' as const
      },
      {
        id: 'q3',
        text: '文档的结构或章节安排是怎样的？',
        icon: '📚',
        category: 'process' as const
      }
    ],
    en: [
      {
        id: 'q1',
        text: 'Summarize the main content of this PDF',
        icon: '📋',
        category: 'summary' as const
      },
      {
        id: 'q2',
        text: 'List the key concepts or terms in the document',
        icon: '💡',
        category: 'concept' as const
      },
      {
        id: 'q3',
        text: 'What is the structure or organization of the document?',
        icon: '📚',
        category: 'process' as const
      }
    ]
  };
  
  // 根据语言返回对应的通用问题
  return language === 'zh' ? universalQuestions.zh : universalQuestions.en;
}

/**
 * 获取问题类型对应的图标
 */
function getQuestionIcon(category: GeneratedQuestion['category']): string {
  const icons = {
    summary: '📋',
    concept: '💡',
    process: '📚',
    comparison: '⚖️',
    application: '🚀'
  };
  
  return icons[category] || '❓';
}

/**
 * 为特定PDF生成推荐问题（主函数）
 */
export async function generatePDFQuestions(content: string, fileName: string): Promise<GeneratedQuestion[]> {
  try {
    console.log('[问题生成器] 开始分析PDF内容...');
    
    // 分析文档内容
    const analysis = analyzeDocumentContent(content, fileName);
    console.log('[问题生成器] 文档分析完成:', analysis);
    
    // 生成推荐问题
    const questions = generateRecommendedQuestions(analysis);
    console.log('[问题生成器] 生成推荐问题:', questions);
    
    return questions;
  } catch (error) {
    console.error('[问题生成器] 生成问题失败:', error);
    
    // 返回默认通用问题
    const defaultQuestions: GeneratedQuestion[] = [
      {
        id: 'default1',
        text: '总结本PDF的主要内容',
        icon: '📋',
        category: 'summary'
      },
      {
        id: 'default2', 
        text: '列出文档中的关键概念或术语',
        icon: '💡',
        category: 'concept'
      },
      {
        id: 'default3',
        text: '文档的结构或章节安排是怎样的？',
        icon: '📚',
        category: 'process'
      }
    ];
    
    return defaultQuestions;
  }
}