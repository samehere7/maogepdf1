import { NextResponse } from 'next/server';

// 闪卡生成模板
const FLASHCARD_PROMPTS = {
  few: {
    count: '5-8',
    description: '生成5-8张闪卡，专注于最核心的概念和要点'
  },
  medium: {
    count: '10-15', 
    description: '生成10-15张闪卡，平衡覆盖主要内容'
  },
  many: {
    count: '20-30',
    description: '生成20-30张闪卡，详细覆盖文档内容'
  }
};

// 解析页面范围
function parsePageRange(pageRange: string | null): number[] | null {
  if (!pageRange) return null;
  
  const pages: number[] = [];
  const parts = pageRange.split(',').map(p => p.trim());
  
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
    } else {
      const page = parseInt(part);
      if (!isNaN(page)) {
        pages.push(page);
      }
    }
  }
  
  return pages.length > 0 ? [...new Set(pages)].sort((a, b) => a - b) : null;
}

// 使用AI生成闪卡内容
async function generateFlashcards(
  pdfContent: string,
  contentAmount: 'few' | 'medium' | 'many',
  pageRange: number[] | null
): Promise<Array<{question: string, answer: string, page_number?: number}>> {
  const config = FLASHCARD_PROMPTS[contentAmount];
  
  const systemPrompt = `你是一个专业的闪卡生成助手。根据提供的PDF内容生成高质量的学习闪卡。

要求：
1. ${config.description}
2. 问题要清晰、具体，答案要准确、简洁
3. 涵盖关键概念、定义、流程、要点等
4. 问题类型包括：概念解释、操作步骤、对比分析、应用场景等
5. 确保问答对逻辑清晰，便于记忆
${pageRange ? `6. 重点关注第${pageRange.join('、')}页的内容` : ''}

请以JSON数组格式返回，每个闪卡包含：
{
  "question": "问题内容",
  "answer": "答案内容",
  "page_number": 页码数字(如果能确定的话)
}

示例格式：
[
  {
    "question": "什么是Git？",
    "answer": "Git是一个分布式版本控制系统，用于跟踪文件变化和协作开发。",
    "page_number": 1
  }
]`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Maoge PDF Flashcard Generator'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请基于以下PDF内容生成${config.count}张闪卡：\n\n${pdfContent}` }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`AI服务错误: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('AI未返回有效响应');
    }

    // 尝试解析JSON响应
    try {
      // 提取JSON部分（处理可能的前后文本）
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('AI响应中未找到有效的JSON数组');
      }
      
      const flashcards = JSON.parse(jsonMatch[0]);
      
      // 验证数据格式
      if (!Array.isArray(flashcards)) {
        throw new Error('AI响应格式错误：不是数组');
      }
      
      return flashcards.filter(card => 
        card.question && 
        card.answer && 
        typeof card.question === 'string' && 
        typeof card.answer === 'string'
      );
      
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError, 'AI响应:', aiResponse);
      throw new Error('AI响应格式错误，无法解析');
    }
    
  } catch (error) {
    console.error('AI闪卡生成失败:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    // 基本的请求验证，不需要数据库
    const { pdfId, pdfName, pdfContent, contentAmount, pageRange } = await req.json();
    
    if (!pdfId || !contentAmount) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 解析页面范围
    const targetPages = parsePageRange(pageRange);
    
    console.log(`[本地闪卡生成] 开始为PDF ${pdfName || pdfId} 生成${contentAmount}级别闪卡`, 
                targetPages ? `，页面范围: ${targetPages.join(',')}` : '');

    // 使用前端传递的PDF内容，如果没有则使用默认内容
    let content = pdfContent || '';
    
    // 如果内容太短，使用默认内容提示
    if (content.length < 100) {
      content = `PDF文档: ${pdfName || 'Unknown'}\n\n请根据这个文档的标题和内容生成相关的学习闪卡。如果无法获取具体内容，请生成与文档主题相关的通用学习问题。`;
    }

    // 生成闪卡内容
    const generatedCards = await generateFlashcards(content, contentAmount, targetPages);
    
    if (generatedCards.length === 0) {
      return NextResponse.json({ error: '未能生成有效的闪卡内容' }, { status: 500 });
    }

    console.log(`[本地闪卡生成] 成功生成${generatedCards.length}张闪卡`);

    // 直接返回生成的闪卡数据，不保存到数据库
    return NextResponse.json({
      success: true,
      message: `成功生成${generatedCards.length}张闪卡`,
      flashcards: generatedCards.map((card, index) => ({
        id: `local_${Date.now()}_${index}`, // 本地临时ID
        question: card.question,
        answer: card.answer,
        page_number: card.page_number,
        difficulty: 0, // 新卡片
        review_count: 0,
        last_reviewed_at: null
      }))
    });

  } catch (error) {
    console.error('[本地闪卡生成] 错误:', error);
    
    let errorMessage = '创建闪卡失败';
    if (error instanceof Error) {
      if (error.message.includes('AI服务错误')) {
        errorMessage = 'AI服务暂时不可用，请稍后重试';
      } else if (error.message.includes('响应格式错误')) {
        errorMessage = 'AI生成内容格式错误，请重试';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}