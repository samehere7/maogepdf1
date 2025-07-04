import { NextRequest, NextResponse } from 'next/server';
import { getPDF } from '@/lib/pdf-service-supabase';
import { createClient } from '@/lib/supabase/server';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';

// 定义模型配置 - 支持差异化模型策略
const MODEL_CONFIGS = {
  fast: {
    provider: "openrouter",
    model: "deepseek/deepseek-chat-v3-0324:free",
    apiKey: process.env.OPENROUTER_API_KEY_FAST || process.env.OPENROUTER_API_KEY,
    maxTokens: 600,
    contextWindow: 4000
  },
  highQuality: {
    provider: "openrouter", 
    model: "deepseek/deepseek-chat-v3-0324:free",
    apiKey: process.env.OPENROUTER_API_KEY_HIGH || process.env.OPENROUTER_API_KEY,
    maxTokens: 1000,
    contextWindow: 4000
  },
  // 普通用户默认使用的免费模型
  default: {
    provider: "openrouter",
    model: "deepseek/deepseek-chat-v3-0324:free",
    apiKey: process.env.OPENROUTER_API_KEY_FREE || process.env.OPENROUTER_API_KEY,
    maxTokens: 800,
    contextWindow: 4000
  },
  // 免费用户大PDF优化配置
  freeLargePdf: {
    provider: "openrouter",
    model: "deepseek/deepseek-chat-v3-0324:free",
    apiKey: process.env.OPENROUTER_API_KEY_HIGH || process.env.OPENROUTER_API_KEY,
    maxTokens: 1200,
    contextWindow: 4000
  },
  // Plus用户大PDF专用配置 - GPT-4o via OpenRouter
  plusLargePdf: {
    provider: "openrouter",
    model: "openai/gpt-4o",
    apiKey: process.env.OPENROUTER_API_KEY_HIGH || process.env.OPENROUTER_API_KEY,
    maxTokens: 4000,
    contextWindow: 128000
  },
  // Plus用户高质量模式 - GPT-4o mini via OpenRouter  
  plusHighQuality: {
    provider: "openrouter",
    model: "openai/gpt-4o-mini",
    apiKey: process.env.OPENROUTER_API_KEY_HIGH || process.env.OPENROUTER_API_KEY,
    maxTokens: 2000,
    contextWindow: 128000
  }
};

// 语言指令映射 - 增强版本
function getLanguageInstruction(locale: string): string {
  const instructions = {
    'zh': '【重要】必须用中文回答！不要使用英文。请用中文回答，保持简洁实用。',
    'en': '【IMPORTANT】You must respond in English! Please respond in English, keep it concise and practical.',
    'ko': '【중요】반드시 한국어로 답변하세요! 영어를 사용하지 마세요. 한국어로 답변해 주세요. 간결하고 실용적으로 유지하세요.',
    'ja': '【重要】必ず日本語で回答してください！英語を使わないでください。日本語で回答してください。簡潔で実用的に保ってください。',
    'es': '【IMPORTANTE】¡Debes responder en español! No uses inglés. Por favor responde en español, manteniéndolo conciso y práctico.',
    'fr': '【IMPORTANT】Vous devez répondre en français ! N\'utilisez pas l\'anglais. Veuillez répondre en français, en restant concis et pratique.',
    'de': '【WICHTIG】Sie müssen auf Deutsch antworten! Verwenden Sie kein Englisch. Bitte antworten Sie auf Deutsch, prägnant und praktisch.',
    'it': '【IMPORTANTE】Devi rispondere in italiano! Non usare l\'inglese. Si prega di rispondere in italiano, mantenendolo conciso e pratico.',
    'pt-BR': '【IMPORTANTE】Você deve responder em português! Não use inglês. Por favor, responda em português, mantendo-o conciso e prático.',
    'ru': '【ВАЖНО】Вы должны отвечать на русском языке! Не используйте английский. Пожалуйста, отвечайте на русском языке, оставайтесь краткими и практичными.',
    'hi': '【महत्वपूर्ण】आपको हिंदी में उत्तर देना चाहिए! अंग्रेजी का उपयोग न करें। कृपया हिंदी में उत्तर दें, इसे संक्षिप्त और व्यावहारिक रखें।',
    'th': '【สำคัญ】คุณต้องตอบเป็นภาษาไทย! อย่าใช้ภาษาอังกฤษ กรุณาตอบเป็นภาษาไทย ให้กระชับและใช้งานได้จริง',
    'vi': '【QUAN TRỌNG】Bạn phải trả lời bằng tiếng Việt! Đừng sử dụng tiếng Anh. Vui lòng trả lời bằng tiếng Việt, giữ cho ngắn gọn và thực tế.',
    'tr': '【ÖNEMLİ】Türkçe yanıtlamalısınız! İngilizce kullanmayın. Lütfen Türkçe yanıtlayın, kısa ve pratik tutun.',
    'ar': '【مهم】يجب أن تجيب باللغة العربية! لا تستخدم الإنجليزية. يرجى الإجابة باللغة العربية، واجعلها موجزة وعملية.',
    'bn': '【গুরুত্বপূর্ণ】আপনাকে অবশ্যই বাংলায় উত্তর দিতে হবে! ইংরেজি ব্যবহার করবেন না। অনুগ্রহ করে বাংলায় উত্তর দিন, সংক্ষিপ্ত এবং ব্যবহারিক রাখুন।',
    'da': '【VIGTIGT】Du skal svare på dansk! Brug ikke engelsk. Svar venligst på dansk, hold det kortfattet og praktisk.',
    'fi': '【TÄRKEÄÄ】Sinun täytyy vastata suomeksi! Älä käytä englantia. Vastaa suomeksi, pidä se ytimekkäänä ja käytännöllisenä.',
    'id': '【PENTING】Anda harus menjawab dalam bahasa Indonesia! Jangan gunakan bahasa Inggris. Harap jawab dalam bahasa Indonesia, jaga agar ringkas dan praktis.',
    'kn': '【ಮುಖ್ಯ】ನೀವು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಬೇಕು! ಇಂಗ್ಲಿಷ್ ಬಳಸಬೇಡಿ। ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ, ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಪ್ರಾಯೋಗಿಕವಾಗಿ ಇರಿಸಿ।',
    'ms': '【PENTING】Anda mesti menjawab dalam bahasa Melayu! Jangan guna bahasa Inggeris. Sila jawab dalam bahasa Melayu, pastikan ringkas dan praktikal.',
    'nl': '【BELANGRIJK】Je moet in het Nederlands antwoorden! Gebruik geen Engels. Antwoord alstublieft in het Nederlands, houd het beknopt en praktisch.',
    'no': '【VIKTIG】Du må svare på norsk! Ikke bruk engelsk. Vennligst svar på norsk, hold det konsist og praktisk.',
    'pa': '【ਮਹੱਤਵਪੂਰਨ】ਤੁਹਾਨੂੰ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦੇਣਾ ਚਾਹੀਦਾ ਹੈ! ਅੰਗਰੇਜ਼ੀ ਦੀ ਵਰਤੋਂ ਨਾ ਕਰੋ। ਕਿਰਪਾ ਕਰਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ, ਇਸਨੂੰ ਸੰਖੇਪ ਅਤੇ ਵਿਹਾਰਕ ਰੱਖੋ।',
    'pl': '【WAŻNE】Musisz odpowiadać po polsku! Nie używaj angielskiego. Proszę odpowiedzieć po polsku, zachowując zwięzłość i praktyczność.',
    'sv': '【VIKTIGT】Du måste svara på svenska! Använd inte engelska. Vänligen svara på svenska, håll det kortfattat och praktiskt.'
  };
  
  return instructions[locale as keyof typeof instructions] || instructions['en'];
}

// PDF大小和复杂度检测 - 增强版
async function detectLargePdf(pdf: any): Promise<boolean> {
  try {
    // 检测条件：
    // 1. 文件大小 > 5MB
    // 2. 可能的页数估算（基于文件大小）
    // 3. 文件名关键词检测
    const fileSizeMB = pdf.size ? (pdf.size / 1024 / 1024) : 0;
    const estimatedPages = fileSizeMB * 20; // 粗略估算：1MB ≈ 20页
    
    // 增强检测：文件名模式匹配
    const namePatterns = [
      /manual|guide|book|教程|手册|文档|说明书/i,
      /\d{3,}页|\d{3,}p|pages/i,  // 页数标识
      /complete|full|comprehensive|完整|全套/i  // 完整性关键词
    ];
    
    const nameMatch = pdf.name && namePatterns.some(pattern => pattern.test(pdf.name));
    
    // 满足以下任一条件认为是大PDF：
    const isLarge = fileSizeMB > 5 || estimatedPages > 100 || nameMatch;
    
    console.log(`[PDF检测] 文件: ${pdf.name}, 大小: ${fileSizeMB.toFixed(2)}MB, 估算页数: ${estimatedPages.toFixed(0)}, 名称匹配: ${nameMatch}, 是否大文档: ${isLarge}`);
    
    return isLarge;
  } catch (error) {
    console.warn('[PDF检测] 检测失败，默认为普通文档:', error);
    return false;
  }
}

// 多Provider API调用函数
async function callAIProvider(modelConfig: any, messages: any[], locale: string = 'zh'): Promise<string> {
  try {
    console.log(`[AI调用] 使用Provider: ${modelConfig.provider}, 模型: ${modelConfig.model}`);
    
    if (modelConfig.provider === 'openai') {
      // OpenAI API调用
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: modelConfig.maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OpenAI] API错误: ${response.status} - ${errorText}`);
        throw new Error(`OpenAI API错误: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '抱歉，AI回答生成失败。';
      
    } else {
      // OpenRouter API调用 (DeepSeek等)
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'X-Title': 'Maoge PDF Chat'
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: modelConfig.maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OpenRouter] API错误: ${response.status} - ${errorText}`);
        throw new Error(`OpenRouter API错误: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '抱歉，AI回答生成失败。';
    }
    
  } catch (error) {
    console.error('[AI调用] 失败:', error);
    throw error;
  }
}

// 大PDF降级处理函数
async function handleLargePdfFallback(pdf: any, question: string, isPlus: boolean, locale: string): Promise<string> {
  console.log('[大PDF降级] 开始分段处理策略');
  
  try {
    // 基于问题类型的智能回答
    const questionType = analyzeQuestionType(question);
    
    if (questionType === 'summary') {
      return generateDocumentSummary(pdf, isPlus, locale);
    } else if (questionType === 'specific') {
      return generateKeywordSearch(pdf, question, locale);
    } else {
      return generateGenericHelp(pdf, question, isPlus, locale);
    }
    
  } catch (error) {
    console.error('[大PDF降级] 处理失败:', error);
    throw error;
  }
}

// 问题类型分析
function analyzeQuestionType(question: string): 'summary' | 'specific' | 'generic' {
  const summaryKeywords = ['总结', '概述', '介绍', 'summary', 'overview', 'what is', '是什么'];
  const specificKeywords = ['如何', '怎么', 'how to', 'why', '为什么', '在哪里', 'where'];
  
  const lowerQuestion = question.toLowerCase();
  
  if (summaryKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'summary';
  } else if (specificKeywords.some(keyword => lowerQuestion.includes(keyword))) {
    return 'specific';
  }
  return 'generic';
}

// 生成文档摘要
function generateDocumentSummary(pdf: any, isPlus: boolean, locale: string): string {
  const templates = {
    zh: {
      plus: `# 📋 大型文档摘要

**文档**: ${pdf.name}
**文件大小**: ${(pdf.size / (1024 * 1024)).toFixed(2)} MB

## 🎯 Plus用户专享功能
作为Plus用户，您享有大型文档的优先处理权限。虽然当前文档处理遇到了技术挑战，但我们为您提供以下建议：

### 📝 优化提问策略
1. **章节式提问**: 询问文档的特定章节或部分
2. **关键词搜索**: 使用具体的技术术语或概念
3. **分步骤查询**: 将复杂问题分解为多个简单问题

### 🔧 技术支持
- 大型文档处理正在优化中
- Plus用户问题将优先处理
- 如需紧急帮助，请联系技术支持`,

      free: `# 📋 大型文档处理说明

**文档**: ${pdf.name}  
**状态**: 超大文档需要特殊处理

## 💡 处理建议
由于这是一个大型文档，建议您：

1. **具体化问题**: 询问文档中的特定内容
2. **关键词搜索**: 使用准确的关键词
3. **升级到Plus**: 获得大文档优先处理权限

### 🎯 提问示例
- "文档中关于X的部分说了什么？"
- "如何实现Y功能？"
- "第N章的主要内容是什么？"`
    },
    en: {
      plus: `# 📋 Large Document Summary

**Document**: ${pdf.name}
**File Size**: ${(pdf.size / (1024 * 1024)).toFixed(2)} MB

## 🎯 Plus User Exclusive Features
As a Plus user, you have priority processing rights for large documents. While current document processing faces technical challenges, we provide the following recommendations:

### 📝 Optimized Query Strategy
1. **Chapter-wise questions**: Ask about specific sections of the document
2. **Keyword search**: Use specific technical terms or concepts  
3. **Step-by-step queries**: Break complex questions into simpler ones

### 🔧 Technical Support
- Large document processing is being optimized
- Plus user questions will be prioritized
- For urgent help, please contact technical support`,

      free: `# 📋 Large Document Processing Instructions

**Document**: ${pdf.name}
**Status**: Extra large document requires special processing

## 💡 Processing Suggestions
Since this is a large document, we recommend:

1. **Specific questions**: Ask about specific content in the document
2. **Keyword search**: Use precise keywords
3. **Upgrade to Plus**: Get priority processing for large documents

### 🎯 Question Examples
- "What does the document say about X?"
- "How to implement Y functionality?"
- "What is the main content of Chapter N?"`
    }
  };
  
  const template = templates[locale as keyof typeof templates] || templates.en;
  return isPlus ? template.plus : template.free;
}

// 生成关键词搜索建议
function generateKeywordSearch(pdf: any, question: string, locale: string): string {
  const keywords = extractKeywords(question);
  
  const templates = {
    zh: `# 🔍 智能关键词搜索

**您的问题**: "${question}"
**文档**: ${pdf.name}

## 🎯 搜索策略
基于您的问题，建议重新提问时包含以下关键词：

${keywords.map(kw => `- **${kw}**`).join('\n')}

## 💡 优化建议
1. **使用更具体的术语**: 替换通用词汇为专业术语
2. **添加上下文**: 说明您想了解的具体方面
3. **分步骤提问**: 将复杂问题拆分为简单问题

### 📝 推荐问题格式
- "在${keywords[0] || '相关主题'}方面，文档提到了什么？"
- "${keywords[1] || '具体功能'}的实现方法是什么？"
- "关于${keywords[2] || '特定概念'}的详细说明在哪里？"`,

    en: `# 🔍 Smart Keyword Search

**Your Question**: "${question}"
**Document**: ${pdf.name}

## 🎯 Search Strategy
Based on your question, we recommend rephrasing with these keywords:

${keywords.map(kw => `- **${kw}**`).join('\n')}

## 💡 Optimization Tips
1. **Use specific terms**: Replace general words with technical terms
2. **Add context**: Specify the exact aspect you want to know
3. **Ask step-by-step**: Break complex questions into simple ones

### 📝 Recommended Question Format
- "What does the document mention about ${keywords[0] || 'relevant topic'}?"
- "What is the implementation method for ${keywords[1] || 'specific function'}?"
- "Where are the detailed instructions for ${keywords[2] || 'specific concept'}?"`
  };
  
  return templates[locale as keyof typeof templates] || templates.en;
}

// 提取关键词
function extractKeywords(question: string): string[] {
  // 简单的关键词提取（实际应用中可以使用更复杂的NLP）
  const stopWords = ['的', '是', '在', '和', '与', '或', '如何', '怎么', '什么', 'the', 'is', 'and', 'or', 'how', 'what', 'where', 'when', 'why'];
  const words = question.toLowerCase().split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );
  return words.slice(0, 3); // 返回前3个关键词
}

// 生成通用帮助
function generateGenericHelp(pdf: any, question: string, isPlus: boolean, locale: string): string {
  const templates = {
    zh: `# 🤔 大型文档处理建议

**文档**: ${pdf.name}
**您的问题**: "${question}"

## 🎯 当前情况
这是一个大型PDF文档，需要特殊的处理策略。${isPlus ? '作为Plus用户，您享有优先处理权限。' : '建议升级到Plus获得更好的大文档处理体验。'}

## 💡 解决方案
### 1. 📍 具体化您的问题
- ❌ "这个文档讲什么？"  
- ✅ "第3章关于API设计的部分说了什么？"

### 2. 🔍 使用关键词搜索
- ❌ "怎么做？"
- ✅ "JWT认证的实现步骤是什么？"

### 3. 📝 分段提问
- ❌ "详细介绍整个系统架构"
- ✅ "数据库设计有哪些要点？"

${isPlus ? '### 🎁 Plus用户福利\n- 大文档优先处理\n- 更长的上下文支持\n- 技术团队优先响应' : '### 🚀 升级建议\n升级到Plus版本享受大文档无忧体验！'}`,

    en: `# 🤔 Large Document Processing Suggestions

**Document**: ${pdf.name}
**Your Question**: "${question}"

## 🎯 Current Situation
This is a large PDF document that requires special processing strategies. ${isPlus ? 'As a Plus user, you have priority processing privileges.' : 'Consider upgrading to Plus for better large document processing experience.'}

## 💡 Solutions
### 1. 📍 Make Your Questions Specific
- ❌ "What does this document say?"
- ✅ "What does Chapter 3 about API design mention?"

### 2. 🔍 Use Keyword Search
- ❌ "How to do it?"
- ✅ "What are the JWT authentication implementation steps?"

### 3. 📝 Ask in Segments
- ❌ "Detailed introduction to the entire system architecture"
- ✅ "What are the key points of database design?"

${isPlus ? '### 🎁 Plus User Benefits\n- Priority processing for large documents\n- Longer context support\n- Priority response from technical team' : '### 🚀 Upgrade Recommendation\nUpgrade to Plus for worry-free large document experience!'}`
  };
  
  return templates[locale as keyof typeof templates] || templates.en;
}

// 生成大PDF帮助信息
function generateLargePdfHelpMessage(pdf: any, question: string, isPlus: boolean, locale: string): string {
  return generateGenericHelp(pdf, question, isPlus, locale);
}

// 简化的降级回答生成器
function generateSmartAnswer(userMessage: string, pdf: any, locale: string = 'zh'): string {
  const errorMessages = {
    'zh': `抱歉，无法连接到AI服务。

**您的问题：** ${userMessage}
**文档：** ${pdf.name}

请稍后重试，或检查网络连接。`,
    'en': `Sorry, unable to connect to AI service.

**Your question:** ${userMessage}
**Document:** ${pdf.name}

Please try again later or check your network connection.`,
    'ko': `죄송합니다. AI 서비스에 연결할 수 없습니다.

**귀하의 질문:** ${userMessage}
**문서:** ${pdf.name}

나중에 다시 시도하거나 네트워크 연결을 확인해 주세요.`,
    'ja': `申し訳ありませんが、AIサービスに接続できません。

**ご質問：** ${userMessage}
**文書：** ${pdf.name}

後でもう一度お試しいただくか、ネットワーク接続をご確認ください。`
  };
  
  return errorMessages[locale as keyof typeof errorMessages] || errorMessages['en'];
}



// 构建简化的系统提示词
function buildSystemPrompt(pdf: any, locale: string = 'zh'): string {
  const fileName = pdf.name || 'PDF文档';
  const summary = pdf.summary || '';
  
  // 根据语言设置回答语言
  const languageInstruction = getLanguageInstruction(locale);
  
  return `你是一个专业的PDF文档助手，正在帮助用户理解和分析文档内容。

文档信息：
- 文件名：${fileName}
- 内容概述：${summary}

请根据以下要求回答用户问题：
- 仅根据PDF文档内容回答用户问题，不要凭空编造。
- 回答要自然、准确、简明，必要时引用原文页码。
- 支持多轮对话，理解用户上下文追问。
- 如果文档中没有相关信息，请直接说明。
- 回答语言与用户界面一致（如中文、英文等）。

${languageInstruction}`;
}

// 构建增强的系统提示词（使用RAG检索结果）
function buildEnhancedSystemPrompt(pdf: any, relevantChunks: any[], userQuestion: string, locale: string = 'zh'): string {
  const fileName = pdf.name || 'PDF文档';
  const summary = pdf.summary || '';
  
  // 构建相关内容上下文
  let contextContent = '';
  if (relevantChunks.length > 0) {
    contextContent = '\n\n【文档相关内容】\n';
    relevantChunks.forEach((result, index) => {
      // 适配现有RAG系统的数据结构
      const pageNumber = result.chunk.pageNumber || '未知';
      const chunkText = result.chunk.text || '';
      
      contextContent += `页面${pageNumber}：${chunkText}\n\n`;
    });
  }
  
  // 根据语言获取对应的回答指令
  const languageInstruction = getLanguageInstruction(locale);
  
  const basePrompt = `你是专业的PDF文档助手，基于提供的文档内容自然回答用户问题。

文档：${fileName}
${summary ? `概述：${summary}` : ''}

用户问题：${userQuestion}
${contextContent}

回答要求：
1. **自然对话风格**：用流畅、简洁的语言回答，就像面对面交流一样
2. **基于文档内容**：根据【文档相关内容】中的信息回答，可以自然重组表达
3. **标注页码引用**：引用内容时用【页码】格式标注，如【8】【12】
4. **重点突出**：适当分点说明，但保持自然流畅
5. **信息不足时**：如果文档中没有相关信息，直接说明"文档中未找到相关内容"
6. **禁止免责声明**：不要添加"注：由于提供的内容不完整..."等免责说明，直接基于提供内容回答

**回答风格示例：**
- "Git分支允许开发者独立开发功能，避免影响主线代码【3】。合并时使用git merge命令即可【5】。"
- "根据文档，主要包括三个步骤：首先...【2】，然后...【4】，最后...【6】。"

${languageInstruction}`;

  return basePrompt;
}

export async function POST(req: Request) {
  console.log('[聊天API] 开始处理请求');
  
  try {
    // 检查用户是否已登录
    console.log('[聊天API] 检查用户登录状态');
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      console.log('[聊天API] 用户未登录');
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.log(`[聊天API] 用户已登录: ${user.email}`);

    // 解析请求体
    console.log('[聊天API] 解析请求体');
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error('[聊天API] JSON解析错误:', jsonError);
      return NextResponse.json({ error: 'JSON格式错误' }, { status: 400 });
    }
    
    const { messages, pdfId, quality = 'highQuality', locale = 'zh' } = requestBody;
    console.log(`[聊天API] 解析参数 - pdfId: ${pdfId}, quality: ${quality}, messages数量: ${messages?.length}, locale: ${locale}`);
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('[聊天API] 消息格式无效');
      return NextResponse.json({ error: '无效的消息格式' }, { status: 400 });
    }

    if (!pdfId) {
      console.log('[聊天API] 未提供PDF ID');
      return NextResponse.json({ error: '未提供PDF ID' }, { status: 400 });
    }

    // 检查用户是否有权限访问该PDF
    console.log(`[聊天API] 检查PDF访问权限: ${pdfId}`);
    let pdf;
    try {
      pdf = await getPDF(pdfId, user.id);
    } catch (pdfError) {
      console.error('[聊天API] 获取PDF错误:', pdfError);
      return NextResponse.json({ error: '获取PDF信息失败' }, { status: 500 });
    }
    
    if (!pdf) {
      console.log('[聊天API] 无权访问该PDF');
      return NextResponse.json({ error: '无权访问该PDF' }, { status: 403 });
    }
    console.log(`[聊天API] PDF访问权限检查通过: ${pdf.name}`);

    console.log(`[聊天API] 处理PDF ${pdfId} 的问题，使用${quality}模式`);
    console.log(`[聊天API] 消息数量: ${messages.length}`);
    console.log(`[聊天API] 用户邮箱: ${user.email}`);

    // 获取最后一条用户消息
    const lastUserMessage = messages[messages.length - 1].content;
    console.log(`[聊天API] 用户问题: ${lastUserMessage}`);
    
    // 检测是否为简单文本操作（解释、总结、改写）
    const isSimpleTextOperation = /^请(简洁地)?(解释|总结|改写|用一句话总结)/.test(lastUserMessage);

    // 检查用户Plus状态并选择合适的模型
    let isPlus = false;
    try {
      // 使用 service role 客户端查询用户Plus状态，绕过JWT问题
      const { supabaseService } = await import('@/lib/supabase/service-client');
      const { data: userData } = await supabaseService
        .from('user_profiles')
        .select('plus, is_active, expire_at')
        .eq('id', user.id)
        .single();
        
      if (userData) {
        // 检查Plus会员是否过期
        const isExpired = userData.expire_at && new Date(userData.expire_at) < new Date();
        isPlus = userData.plus && userData.is_active && !isExpired;
      }
    } catch (error) {
      console.log('[聊天API] 无法获取用户Plus状态，使用默认模型:', error);
    }

    // 使用AI模型进行智能对话
    console.log(`[聊天API] 用户Plus状态: ${isPlus}, 请求质量: ${quality}`);
    
    // 检测PDF大小和复杂度，智能选择模型配置
    const isLargePdf = await detectLargePdf(pdf);
    console.log(`[聊天API] PDF大小检测: 大文档=${isLargePdf}, 文件=${pdf.name}`);
    
    try {
      // 智能选择模型配置 - 差异化策略
      let modelConfig;
      if (isLargePdf && isPlus) {
        // Plus用户 + 大PDF：使用GPT-4o高性能配置
        modelConfig = MODEL_CONFIGS.plusLargePdf;
        console.log('[聊天API] Plus用户大PDF：使用GPT-4o专用配置', {
          model: modelConfig.model,
          provider: modelConfig.provider,
          maxTokens: modelConfig.maxTokens,
          hasApiKey: !!modelConfig.apiKey
        });
      } else if (isLargePdf) {
        // 免费用户 + 大PDF：使用优化的DeepSeek配置
        modelConfig = MODEL_CONFIGS.freeLargePdf;
        console.log('[聊天API] 免费用户大PDF：使用DeepSeek优化配置');
      } else if (isPlus) {
        // Plus用户 + 普通PDF：可选择高质量模式
        if (quality === 'highQuality') {
          modelConfig = MODEL_CONFIGS.plusHighQuality;
          console.log('[聊天API] Plus用户：使用GPT-4o-mini高质量模式', {
            model: modelConfig.model,
            provider: modelConfig.provider,
            maxTokens: modelConfig.maxTokens,
            hasApiKey: !!modelConfig.apiKey
          });
        } else {
          modelConfig = MODEL_CONFIGS[quality as keyof typeof MODEL_CONFIGS] || MODEL_CONFIGS.highQuality;
          console.log('[聊天API] Plus用户：使用DeepSeek快速模式');
        }
      } else {
        // 普通用户：使用免费模型
        modelConfig = MODEL_CONFIGS.default;
        console.log('[聊天API] 免费用户：使用DeepSeek默认配置');
      }
      
      // 根据请求类型选择处理方式
      let enhancedSystemPrompt;
      
      if (isSimpleTextOperation) {
        // 简单文本操作，使用简化的提示词
        console.log('[聊天API] 检测到简单文本操作，使用简化处理');
        const languageInstruction = getLanguageInstruction(locale);
        enhancedSystemPrompt = `你是一个专业的文本处理助手。请根据用户要求直接处理文本，给出简洁准确的回答。

要求：
1. 直接回答，不添加解释或额外信息
2. 保持简洁明了
3. 专注于用户的具体要求

${languageInstruction}

用户请求：${lastUserMessage}`;
        
      } else {
        // 使用智能RAG系统生成回答 - 差异化策略
        try {
          console.log('[聊天API] 使用智能RAG系统生成回答');
          
          // 确保PDF已在RAG系统中处理
          const ragStats = pdfRAGSystem.getDocumentStats();
          if (ragStats.totalChunks === 0 || !pdfRAGSystem.switchToPDF(pdfId)) {
            console.log('[聊天API] PDF未在RAG系统中，开始处理...');
            await pdfRAGSystem.extractAndChunkPDF(pdf.url, pdfId);
          } else {
            console.log('[聊天API] 已切换到目标PDF的RAG内容');
          }
          
          // 根据用户类型和PDF大小选择RAG模式
          let ragMode: 'fast' | 'high' | 'enhanced' | 'premium';
          if (isLargePdf && isPlus) {
            ragMode = 'premium';  // Plus用户大PDF：最高质量
            console.log('[聊天API] Plus用户大PDF：使用premium RAG模式');
          } else if (isLargePdf) {
            ragMode = 'enhanced'; // 免费用户大PDF：增强模式
            console.log('[聊天API] 免费用户大PDF：使用enhanced RAG模式');
          } else if (isPlus) {
            ragMode = 'high';     // Plus用户普通PDF：高质量模式
            console.log('[聊天API] Plus用户：使用high RAG模式');
          } else {
            ragMode = 'fast';     // 免费用户普通PDF：快速模式
            console.log('[聊天API] 免费用户：使用fast RAG模式');
          }
          
          // 使用智能RAG系统生成回答
          const ragAnswer = await pdfRAGSystem.generateAnswer(
            lastUserMessage, 
            pdf.name, 
            ragMode as any, 
            locale,
            {
              modelConfig: modelConfig,
              provider: modelConfig.provider,
              isPlus: isPlus,
              isLargePdf: isLargePdf
            }
          );
          console.log('[聊天API] RAG系统生成回答成功');
          
          // 对于新用户或大PDF，添加使用指导
          let finalAnswer = ragAnswer;
          if (isLargePdf && Math.random() < 0.3) { // 30%概率显示指导
            const guidance = generateUserGuidance(isPlus, isLargePdf, locale);
            finalAnswer = `${ragAnswer}\n\n---\n\n${guidance}`;
          }
          
          // 直接返回RAG系统的回答
          return NextResponse.json({
            content: finalAnswer,
            role: 'assistant'
          });
          
        } catch (ragError) {
          console.error('[聊天API] RAG系统失败，使用传统方式:', ragError);
          
          // 智能降级处理 - 增强版
          if (isLargePdf) {
            console.log('[聊天API] 大PDF处理失败，启动智能降级处理');
            
            // 尝试分段处理策略
            try {
              const fallbackAnswer = await handleLargePdfFallback(pdf, lastUserMessage, isPlus, locale);
              return NextResponse.json({
                content: fallbackAnswer,
                role: 'assistant'
              });
            } catch (fallbackError) {
              console.error('[聊天API] 降级处理也失败:', fallbackError);
              
              // 最终降级：提供结构化的帮助信息
              const helpMessage = generateLargePdfHelpMessage(pdf, lastUserMessage, isPlus, locale);
              return NextResponse.json({
                content: helpMessage,
                role: 'assistant'
              });
            }
          }
          
          // 普通PDF降级到传统方式
          enhancedSystemPrompt = buildSystemPrompt(pdf, locale);
          
          // 记录RAG失败的详细信息，用于后续优化
          console.log('[聊天API] RAG失败详情:', {
            error: ragError instanceof Error ? ragError.message : String(ragError),
            pdfId: pdfId,
            pdfName: pdf.name,
            isLargePdf: isLargePdf,
            question: lastUserMessage.substring(0, 100) // 只记录前100字符
          });
        }
      }
      
      // 调用AI API - 支持多Provider
      const messages = [
        { role: 'system', content: enhancedSystemPrompt },
        { role: 'user', content: lastUserMessage }
      ];
      
      const aiAnswer = await callAIProvider(modelConfig, messages, locale);
      console.log(`[聊天API] AI回答生成成功，长度: ${aiAnswer.length}, Provider: ${modelConfig.provider}`);
      
      return NextResponse.json({
        content: aiAnswer,
        role: 'assistant'
      });
      
    } catch (answerError) {
      console.error('[聊天API] AI服务调用失败:', answerError);
      // 降级到简单错误提示
      const fallbackAnswer = generateSmartAnswer(lastUserMessage, pdf, locale);
      return NextResponse.json({
        content: fallbackAnswer,
        role: 'assistant'
      });
    }

  } catch (error: any) {
    console.error('[聊天API] 详细错误:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
      stack: error.stack?.split('\n').slice(0, 5) // 只显示前5行堆栈
    });
    
    let errorMessage = "抱歉，处理您的问题时出错了。请稍后再试。";
    
    // 处理具体的API错误
    if (error.response?.status === 401) {
      errorMessage = "API密钥验证失败，请检查配置。";
    } else if (error.response?.status === 429) {
      errorMessage = "请求过于频繁，请稍后再试。";
    } else if (error.response?.status >= 500) {
      errorMessage = "服务器暂时不可用，请稍后再试。";
    }
    
    return NextResponse.json({
      content: errorMessage,
      role: "assistant"
    }, { status: 500 });
  }
}

// 性能监控和错误追踪辅助函数
function trackPerformance(operation: string, startTime: number, isSuccess: boolean, metadata?: any) {
  const duration = Date.now() - startTime;
  const logData = {
    operation,
    duration,
    success: isSuccess,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  
  console.log(`[性能监控] ${operation}:`, logData);
  
  // 性能阈值警告
  if (duration > 10000) { // 10秒
    console.warn(`[性能警告] ${operation} 耗时过长: ${duration}ms`);
  }
}

// 用户体验优化：分级提示信息
function generateUserGuidance(isPlus: boolean, isLargePdf: boolean, locale: string = 'zh'): string {
  const guidance = {
    zh: {
      plusLarge: `🎯 **Plus用户专享大PDF服务**\n\n您正在享受GPT-4o驱动的高质量大文档处理服务。为了获得最佳体验：\n\n• **具体化问题**：如"第5章的核心观点是什么？"\n• **分步骤提问**：将复杂问题拆分为多个简单问题\n• **关键词搜索**：使用文档中的专业术语\n\n💡 Plus用户享有优先处理权限和更长的上下文支持。`,
      freeLarge: `📚 **大型文档智能处理**\n\n我们为您优化了大文档的处理体验。建议您：\n\n• **精确提问**：使用具体的章节、概念或关键词\n• **分段查询**：逐步深入了解文档内容\n• **升级Plus**：获得GPT-4o专用处理和优先支持\n\n🚀 [升级到Plus](/#pricing) 解锁大文档无限制体验`,
      normal: `💬 **智能PDF对话助手**\n\n我已准备好回答您关于文档的任何问题：\n\n• 文档内容解释和总结\n• 关键信息查找和定位\n• 概念解析和知识扩展\n\n请随时开始您的提问！`
    },
    en: {
      plusLarge: `🎯 **Plus User Exclusive Large PDF Service**\n\nYou're enjoying high-quality large document processing powered by GPT-4o. For the best experience:\n\n• **Be Specific**: Ask "What are the core points in Chapter 5?"\n• **Ask Step-by-Step**: Break complex questions into simpler ones\n• **Use Keywords**: Use professional terms from the document\n\n💡 Plus users enjoy priority processing and extended context support.`,
      freeLarge: `📚 **Smart Large Document Processing**\n\nWe've optimized the large document experience for you. We recommend:\n\n• **Precise Questions**: Use specific chapters, concepts, or keywords\n• **Segmented Queries**: Gradually explore document content\n• **Upgrade to Plus**: Get GPT-4o dedicated processing and priority support\n\n🚀 [Upgrade to Plus](/#pricing) for unlimited large document experience`,
      normal: `💬 **Smart PDF Chat Assistant**\n\nI'm ready to answer any questions about your document:\n\n• Document content explanation and summary\n• Key information search and location\n• Concept analysis and knowledge expansion\n\nFeel free to start asking!`
    }
  };
  
  const lang = guidance[locale as keyof typeof guidance] || guidance.en;
  
  if (isLargePdf && isPlus) {
    return lang.plusLarge;
  } else if (isLargePdf) {
    return lang.freeLarge;
  } else {
    return lang.normal;
  }
} 