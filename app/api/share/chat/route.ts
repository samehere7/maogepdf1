import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 定义模型配置 - 分享用户使用免费模型
const MODEL_CONFIG = {
  model: "deepseek/deepseek-chat-v3-0324:free",
  apiKey: process.env.OPENROUTER_API_KEY_FREE || process.env.OPENROUTER_API_KEY,
  maxTokens: 300
};

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const { message, pdfId, shareId } = await req.json();
    
    if (!message || !pdfId || !shareId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证分享链接是否有效（简单验证）
    const expectedPdfId = shareId.split('-')[0];
    if (expectedPdfId !== pdfId) {
      return NextResponse.json({ error: '无效的分享链接' }, { status: 403 });
    }

    // 获取PDF信息（不需要用户认证）
    const supabase = createClient();
    const { data: pdf, error: pdfError } = await supabase
      .from('pdfs')
      .select('id, name, url, summary')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdf) {
      return NextResponse.json({ error: 'PDF文件不存在' }, { status: 404 });
    }

    // 构建系统提示词（针对分享访问优化）
    const systemPrompt = `你是一个专业的PDF文档助手，正在帮助访问者理解分享的PDF文档。

文档信息：
- 文件名：${pdf.name}
- 内容概述：${pdf.summary || ''}

请根据以下要求回答用户问题：
- 仅根据PDF文档内容回答问题，不要凭空编造。
- 回答要自然、准确、简明，必要时引用原文页码。
- 如果文档中没有相关信息，请直接说明。
- 回答语言与用户提问保持一致。
- 这是一个分享访问会话，请提供有帮助的回答。

请用中文回答，保持简洁实用。`;

    // 调用AI模型
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MODEL_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Maoge PDF Share Chat'
      },
      body: JSON.stringify({
        model: MODEL_CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: MODEL_CONFIG.maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status);
      throw new Error(`AI服务错误: ${response.status}`);
    }

    const data = await response.json();
    const aiAnswer = data.choices[0]?.message?.content || '抱歉，我无法理解您的问题，请重新表述。';
    
    return NextResponse.json({
      content: aiAnswer,
      role: 'assistant'
    });
    
  } catch (error) {
    console.error('分享聊天API错误:', error);
    
    // 提供降级回答
    const fallbackAnswer = `抱歉，处理您的问题时出现了问题。这可能是因为：

• 网络连接不稳定
• AI服务暂时不可用
• 分享链接可能已过期

建议您：
1. 检查网络连接
2. 稍后重试
3. 联系文档分享者

如果问题持续存在，请重新获取分享链接。`;

    return NextResponse.json({
      content: fallbackAnswer,
      role: "assistant"
    }, { status: 200 }); // 返回200状态码，避免前端显示错误
  }
}