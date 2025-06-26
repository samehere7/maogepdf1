import { NextRequest, NextResponse } from 'next/server';
import { getPDF } from '@/lib/pdf-service-supabase';
import { createClient } from '@/lib/supabase/server';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';

// 定义模型配置 - 全部使用DeepSeek免费模型
const MODEL_CONFIGS = {
  fast: {
    model: "deepseek/deepseek-chat-v3-0324:free",
    apiKey: process.env.OPENROUTER_API_KEY_FAST || process.env.OPENROUTER_API_KEY,
    maxTokens: 200 // 增加token确保回答完整
  },
  highQuality: {
    model: "deepseek/deepseek-chat-v3-0324:free",
    apiKey: process.env.OPENROUTER_API_KEY_HIGH || process.env.OPENROUTER_API_KEY,
    maxTokens: 300 // 高质量模式更多token
  },
  // 普通用户默认使用的免费模型
  default: {
    model: "deepseek/deepseek-chat-v3-0324:free",
    apiKey: process.env.OPENROUTER_API_KEY_FREE || process.env.OPENROUTER_API_KEY,
    maxTokens: 250 // 免费模式适中token
  }
};

// 语言指令映射
function getLanguageInstruction(locale: string): string {
  const instructions = {
    'zh': '请用中文回答，保持简洁实用。',
    'en': 'Please respond in English, keep it concise and practical.',
    'ko': '한국어로 답변해 주세요. 간결하고 실용적으로 유지하세요.',
    'ja': '日本語で回答してください。簡潔で実用的に保ってください。',
    'es': 'Por favor responde en español, manteniéndolo conciso y práctico.',
    'fr': 'Veuillez répondre en français, en restant concis et pratique.',
    'de': 'Bitte antworten Sie auf Deutsch, prägnant und praktisch.',
    'it': 'Si prega di rispondere in italiano, mantenendolo conciso e pratico.',
    'pt-BR': 'Por favor, responda em português, mantendo-o conciso e prático.',
    'ru': 'Пожалуйста, отвечайте на русском языке, оставайтесь краткими и практичными.',
    'hi': 'कृपया हिंदी में उत्तर दें, इसे संक्षिप्त और व्यावहारिक रखें।',
    'th': 'กรุณาตอบเป็นภาษาไทย ให้กระชับและใช้งานได้จริง',
    'vi': 'Vui lòng trả lời bằng tiếng Việt, giữ cho ngắn gọn và thực tế.',
    'tr': 'Lütfen Türkçe yanıtlayın, kısa ve pratik tutun.',
    'ar': 'يرجى الإجابة باللغة العربية، واجعلها موجزة وعملية.',
    'bn': 'অনুগ্রহ করে বাংলায় উত্তর দিন, সংক্ষিপ্ত এবং ব্যবহারিক রাখুন।',
    'da': 'Svar venligst på dansk, hold det kortfattet og praktisk.',
    'fi': 'Vastaa suomeksi, pidä se ytimekkäänä ja käytännöllisenä.',
    'id': 'Harap jawab dalam bahasa Indonesia, jaga agar ringkas dan praktis.',
    'kn': 'ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ, ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಪ್ರಾಯೋಗಿಕವಾಗಿ ಇರಿಸಿ।',
    'ms': 'Sila jawab dalam bahasa Melayu, pastikan ringkas dan praktikal.',
    'nl': 'Antwoord alstublieft in het Nederlands, houd het beknopt en praktisch.',
    'no': 'Vennligst svar på norsk, hold det konsist og praktisk.',
    'pa': 'ਕਿਰਪਾ ਕਰਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ, ਇਸਨੂੰ ਸੰਖੇਪ ਅਤੇ ਵਿਹਾਰਕ ਰੱਖੋ।',
    'pl': 'Proszę odpowiedzieć po polsku, zachowując zwięzłość i praktyczność.',
    'sv': 'Vänligen svara på svenska, håll det kortfattat och praktiskt.'
  };
  
  return instructions[locale as keyof typeof instructions] || instructions['en'];
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
    console.log(`[聊天API] 解析参数 - pdfId: ${pdfId}, quality: ${quality}, messages数量: ${messages?.length}`);
    
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
    try {
      // 选择模型配置
      let modelConfig;
      if (isPlus) {
        // Plus用户可以选择高质量或快速模式
        modelConfig = MODEL_CONFIGS[quality as keyof typeof MODEL_CONFIGS] || MODEL_CONFIGS.highQuality;
      } else {
        // 普通用户使用免费模型
        modelConfig = MODEL_CONFIGS.default;
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
        // 使用智能RAG系统生成回答
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
          
          // 使用智能RAG系统生成回答，传递语言信息
          const ragAnswer = await pdfRAGSystem.generateAnswer(lastUserMessage, pdf.name, 'high', locale);
          console.log('[聊天API] RAG系统生成回答成功');
          
          // 直接返回RAG系统的回答，不再调用OpenRouter
          return NextResponse.json({
            content: ragAnswer,
            role: 'assistant'
          });
          
        } catch (ragError) {
          console.error('[聊天API] RAG系统失败，使用传统方式:', ragError);
          // 降级到传统方式
          enhancedSystemPrompt = buildSystemPrompt(pdf, locale);
          
          // 记录RAG失败的详细信息，用于后续优化
          console.log('[聊天API] RAG失败详情:', {
            error: ragError instanceof Error ? ragError.message : String(ragError),
            pdfId: pdfId,
            pdfName: pdf.name,
            question: lastUserMessage.substring(0, 100) // 只记录前100字符
          });
        }
      }
      
      // 调用OpenAI API
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
          messages: [
            { role: 'system', content: enhancedSystemPrompt },
            { role: 'user', content: lastUserMessage }
          ],
          temperature: 0.7,
          max_tokens: isSimpleTextOperation ? 100 : modelConfig.maxTokens, // 简单操作使用更少token
          stream: false // 确保非流式响应以简化处理
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiAnswer = data.choices[0]?.message?.content || '抱歉，AI回答生成失败，请重试。';
      
      console.log(`[聊天API] GPT-4o回答生成成功，长度: ${aiAnswer.length}`);
      
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