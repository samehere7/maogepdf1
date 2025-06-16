import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 使用OpenRouter的DeepSeek免费模型
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY_FREE || process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

export async function POST(request: Request) {
  try {
    const { text, operation } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: '请提供要处理的文本' },
        { status: 400 }
      );
    }

    let prompt = '';
    switch (operation) {
      case 'explain':
        prompt = `请详细解释以下文本的含义：\n\n${text}\n\n请从以下几个方面进行解释：\n1. 主要内容\n2. 关键概念\n3. 背景信息（如果相关）`;
        break;
      case 'rewrite':
        prompt = `请用不同的表达方式改写以下文本，保持原意但使用更清晰或更优雅的表达：\n\n${text}`;
        break;
      case 'summarize':
        prompt = `请简要总结以下文本的要点：\n\n${text}`;
        break;
      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        );
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "你是一个专业的文本分析助手，擅长解释、改写和总结文本。请用简洁清晰的语言回答。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "deepseek/deepseek-chat-v3-0324:free",
      extra_headers: {
        "HTTP-Referer": "https://maoge.pdf",
        "X-Title": "Maoge PDF"
      }
    });

    const result = completion.choices[0].message.content;

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI处理错误:', error);
    return NextResponse.json(
      { error: '处理请求时出错' },
      { status: 500 }
    );
  }
} 