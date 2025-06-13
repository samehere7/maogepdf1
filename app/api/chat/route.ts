import { NextRequest, NextResponse } from 'next/server';
import { getPDF } from '@/lib/pdf-service';
import { createClient } from '@/lib/supabase/server';
import { extractTextFromPDF, summarizeTextForContext } from '@/lib/pdf-text-extractor';

// 定义模型配置
const MODEL_CONFIGS = {
  fast: {
    model: "openai/gpt-4o-mini",
    apiKey: "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"
  },
  highQuality: {
    model: "openai/gpt-4o-2024-11-20",
    apiKey: "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"
  }
};

// 移除所有不需要的函数，直接使用OpenRouter API

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
    
    const { messages, pdfId, quality = 'highQuality' } = requestBody;
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

    // 提取PDF文本内容
    console.log(`[聊天API] 开始提取PDF文本内容`);
    let pdfContent = '';
    try {
      // 构建完整的PDF URL
      const pdfUrl = pdf.url.startsWith('http') ? pdf.url : 
                     `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${pdf.url}`;
      
      console.log(`[聊天API] PDF URL: ${pdfUrl}`);
      pdfContent = await extractTextFromPDF(pdfUrl);
      
      // 如果文本太长，进行智能摘要
      pdfContent = summarizeTextForContext(pdfContent, 6000);
      console.log(`[聊天API] PDF内容提取成功，最终长度: ${pdfContent.length}`);
    } catch (extractError) {
      console.error('[聊天API] PDF文本提取失败:', extractError);
      // 如果提取失败，使用文件名作为上下文
      pdfContent = `文档标题: ${pdf.name}\n注意: 无法提取PDF文本内容，请基于文档标题回答相关问题。`;
    }

    // 使用OpenRouter API
    const modelConfig = MODEL_CONFIGS[quality as keyof typeof MODEL_CONFIGS];
    if (!modelConfig) {
      console.error(`[聊天API] 无效的quality参数: ${quality}`);
      return NextResponse.json({ error: '无效的模型质量参数' }, { status: 400 });
    }
    
    console.log(`[聊天API] 使用模型: ${modelConfig.model}`);
    
    // 构建系统提示，包含PDF内容
    const systemPrompt = `你是一个专业的PDF文档助手。用户正在与一个PDF文档进行对话。

PDF文档内容：
${pdfContent}

请基于上述PDF文档内容回答用户的问题。要求：
1. 只基于提供的PDF内容回答问题
2. 如果问题涉及文档中没有的信息，请明确说明"文档中没有相关信息"
3. 引用具体的页面或段落（如果可能）
4. 保持回答简洁、准确、专业
5. 如果用户问候或进行一般性对话，可以友好回应，但要引导回到文档内容`;

    // 准备消息列表
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log(`[聊天API] 调用${modelConfig.model}模型`);
    console.log(`[聊天API] API密钥前缀: ${modelConfig.apiKey.substring(0, 15)}...`);
    console.log(`[聊天API] API密钥长度: ${modelConfig.apiKey.length}`);
    console.log(`[聊天API] 消息数量: ${chatMessages.length}`);

    // 使用原生fetch调用OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modelConfig.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://maoge.pdf',
        'X-Title': 'Maoge PDF',
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[聊天API] OpenRouter API错误: ${response.status}`, errorText);
      throw new Error(`OpenRouter API错误: ${response.status} - ${errorText}`);
    }

    const completion = await response.json();
    const aiResponse = completion.choices[0].message.content || "抱歉，我无法生成回答。";

    console.log(`[聊天API] 成功生成回答，长度: ${aiResponse.length}`);
    console.log(`[聊天API] 回答预览: ${aiResponse.substring(0, 100)}...`);

    return NextResponse.json({
      content: aiResponse,
      role: 'assistant'
    });
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