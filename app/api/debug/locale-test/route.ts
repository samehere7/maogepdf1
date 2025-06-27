import { NextRequest, NextResponse } from 'next/server';

interface DebugStep {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  timestamp: string;
}

function createDebugStep(step: string, status: 'success' | 'error' | 'warning', message: string, data?: any): DebugStep {
  return {
    step,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  const debugSteps: DebugStep[] = [];
  
  try {
    debugSteps.push(createDebugStep('1', 'success', '开始Locale参数调试'));

    // 解析请求数据
    let requestData;
    try {
      requestData = await request.json();
      debugSteps.push(createDebugStep('2', 'success', '请求数据解析成功', {
        rawData: requestData,
        keys: Object.keys(requestData),
        localeValue: requestData.locale,
        localeType: typeof requestData.locale
      }));
    } catch (error) {
      debugSteps.push(createDebugStep('2', 'error', '请求数据解析失败', { error: String(error) }));
      return NextResponse.json({ debugSteps }, { status: 400 });
    }

    // 提取参数
    const { pdfId, question, mode = 'fast', locale = 'zh' } = requestData;

    debugSteps.push(createDebugStep('3', 'success', '参数提取完成', {
      pdfId: pdfId,
      question: question,
      mode: mode,
      locale: locale,
      localeSource: requestData.locale ? 'from_request' : 'default_value'
    }));

    // 测试多语言系统提示词生成
    const getSystemPromptByLocale = (locale: string, pdfName: string): string => {
      const prompts = {
        'zh': `你是一个智能文档助手。用户正在查看一个名为"${pdfName}"的PDF文档，请根据用户的问题给出有帮助的回答。请用中文回答。`,
        'en': `You are an intelligent document assistant. The user is viewing a PDF document named "${pdfName}". Please provide helpful answers based on the user's questions. Please respond in English.`,
        'ja': `あなたは賢い文書アシスタントです。ユーザーは「${pdfName}」というPDF文書を見ています。ユーザーの質問に基づいて役立つ回答を提供してください。日本語で回答してください。`,
        'ko': `당신은 지능적인 문서 도우미입니다. 사용자가 "${pdfName}"라는 PDF 문서를 보고 있습니다. 사용자의 질문에 따라 도움이 되는 답변을 제공해 주세요. 한국어로 답변해 주세요.`,
      };
      
      return prompts[locale as keyof typeof prompts] || prompts['en'];
    };

    const systemPrompt = getSystemPromptByLocale(locale, 'Test Document');
    
    debugSteps.push(createDebugStep('4', 'success', '系统提示词生成测试', {
      inputLocale: locale,
      outputPrompt: systemPrompt,
      promptLanguage: systemPrompt.includes('中文') ? 'Chinese' : 
                     systemPrompt.includes('English') ? 'English' :
                     systemPrompt.includes('日本語') ? 'Japanese' :
                     systemPrompt.includes('한국어') ? 'Korean' : 'Unknown'
    }));

    // 测试请求头信息
    debugSteps.push(createDebugStep('5', 'success', '请求头信息', {
      userAgent: request.headers.get('user-agent'),
      acceptLanguage: request.headers.get('accept-language'),
      contentType: request.headers.get('content-type'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    }));

    // 模拟OpenRouter API调用测试
    const testApiCall = {
      model: mode === 'fast' ? 'deepseek/deepseek-chat' : 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: question || 'Test question'
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    debugSteps.push(createDebugStep('6', 'success', 'API调用配置生成', {
      apiCallConfig: testApiCall,
      systemMessageLength: systemPrompt.length,
      hasCorrectLocale: locale !== 'zh' ? 'non-chinese-locale' : 'default-chinese'
    }));

    return NextResponse.json({
      success: true,
      debugSteps,
      summary: {
        localeReceived: requestData.locale,
        localeUsed: locale,
        systemPromptGenerated: !!systemPrompt,
        expectedLanguage: locale === 'ja' ? 'Japanese' : 
                         locale === 'ko' ? 'Korean' :
                         locale === 'en' ? 'English' : 'Chinese'
      }
    });

  } catch (error) {
    debugSteps.push(createDebugStep('error', 'error', '调试过程发生错误', { 
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }));
    
    return NextResponse.json({ 
      success: false,
      debugSteps,
      error: String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Locale Debug API - Use POST method with JSON body',
    expectedBody: {
      pdfId: 'string',
      question: 'string',
      mode: 'fast|high',
      locale: 'zh|en|ja|ko|es|fr|de|it|pt-BR|ru'
    }
  });
}