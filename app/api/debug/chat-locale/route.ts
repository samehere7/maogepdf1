import { NextRequest, NextResponse } from 'next/server';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';

// 专门用于调试多语言功能的API端点
export async function POST(request: NextRequest) {
  console.log('[调试多语言API] 开始处理请求');
  
  try {
    const requestBody = await request.json();
    console.log('[调试多语言API] ===== 完整请求体DEBUG =====');
    console.log('[调试多语言API] 原始请求体:', JSON.stringify(requestBody, null, 2));
    console.log('[调试多语言API] =========================');
    
    const { question = '请解释Git的重要性', locale = 'zh', mode = 'fast' } = requestBody;
    
    console.log(`[调试多语言API] ===== 关键参数DEBUG =====`);
    console.log(`[调试多语言API] question: "${question}"`);
    console.log(`[调试多语言API] locale值: "${locale}"`);
    console.log(`[调试多语言API] locale类型: ${typeof locale}`);
    console.log(`[调试多语言API] mode: ${mode}`);
    console.log(`[调试多语言API] 是否有locale字段: ${'locale' in requestBody}`);
    console.log(`[调试多语言API] requestBody.locale: "${requestBody.locale}"`);
    console.log(`[调试多语言API] ========================`);
    
    // 创建虚拟PDF对象用于测试
    const mockPdf = {
      id: 'debug-test-pdf',
      name: 'Debug Test Document',
      url: 'debug://test',
      summary: 'This is a test document for debugging multi-language functionality.'
    };
    
    console.log(`[调试多语言API] 使用虚拟PDF进行测试: ${mockPdf.name}`);
    
    // 直接使用RAG系统生成答案，绕过PDF权限检查
    let answer;
    try {
      console.log(`[调试多语言API] 调用RAG系统生成答案，locale: ${locale}`);
      
      // 由于没有实际PDF内容，使用AI生成通用回答
      answer = await pdfRAGSystem.generateAnswer(question, mockPdf.name, mode as 'high' | 'fast', locale);
      
      console.log(`[调试多语言API] RAG系统生成答案成功，长度: ${answer.length}`);
      
    } catch (ragError) {
      console.error('[调试多语言API] RAG系统失败:', ragError);
      
      // 降级：直接调用OpenRouter API
      const languageInstructions = {
        'zh': '【重要】必须用中文回答！请用中文回答，保持简洁实用。',
        'en': '【IMPORTANT】You must respond in English! Please respond in English, keep it concise and practical.',
        'ko': '【중요】반드시 한국어로 답변하세요! 한국어로 답변해 주세요. 간결하고 실용적으로 유지하세요.',
        'ja': '【重要】必ず日本語で回答してください。英語を使用せず、全て日本語で書いてください。',
        'es': '【IMPORTANTE】¡Debes responder en español! Por favor responde en español, manteniéndolo conciso y práctico.',
        'fr': '【IMPORTANT】Vous devez répondre en français ! Veuillez répondre en français, en restant concis et pratique.',
        'de': '【WICHTIG】Sie müssen auf Deutsch antworten! Bitte antworten Sie auf Deutsch, prägnant und praktisch.',
        'it': '【IMPORTANTE】Devi rispondere in italiano! Si prega di rispondere in italiano, mantenendolo conciso e pratico.',
        'pt-BR': '【IMPORTANTE】Você deve responder em português! Por favor, responda em português, mantendo-o conciso e prático.',
        'ru': '【ВАЖНО】Вы должны отвечать на русском языке! Пожалуйста, отвечайте на русском языке, оставайтесь краткими и практичными.'
      };
      
      const languageInstruction = languageInstructions[locale as keyof typeof languageInstructions] || languageInstructions['en'];
      
      const prompt = `${languageInstruction}\n\n用户问题：${question}\n\n请简洁回答这个问题。`;
      
      console.log(`[调试多语言API] 使用OpenRouter API，语言指令: ${languageInstruction.substring(0, 30)}...`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[调试多语言API] OpenRouter API错误: ${response.status} - ${errorText}`);
        throw new Error(`OpenRouter API错误: ${response.status}`);
      }

      const data = await response.json();
      answer = data.choices[0]?.message?.content || '抱歉，无法生成回答。';
      
      console.log(`[调试多语言API] OpenRouter API回答生成成功，长度: ${answer.length}`);
    }
    
    console.log(`[调试多语言API] 最终答案前50字符: ${answer.substring(0, 50)}...`);
    
    return NextResponse.json({
      success: true,
      data: {
        question,
        locale,
        mode,
        answer,
        pdfName: mockPdf.name,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[调试多语言API] 处理请求失败:', error);
    return NextResponse.json({ 
      success: false,
      error: '调试请求处理失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}