import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question = "Hello, how are you?" } = await request.json();

    console.log('[OpenRouter Test] Testing OpenRouter API with question:', question);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个智能助手，请用中文回答问题。'
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    console.log('[OpenRouter Test] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenRouter Test] Error response:', errorText);
      return NextResponse.json({ 
        success: false,
        error: `OpenRouter API error: ${response.status}`,
        details: errorText
      }, { status: 500 });
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || '无法生成回答';

    console.log('[OpenRouter Test] Success, answer length:', answer.length);

    return NextResponse.json({
      success: true,
      answer,
      model: 'deepseek/deepseek-chat',
      usage: data.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[OpenRouter Test] Exception:', error);
    return NextResponse.json({
      success: false,
      error: 'Exception occurred',
      details: String(error)
    }, { status: 500 });
  }
}