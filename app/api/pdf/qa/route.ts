import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';
import { supabaseService } from '@/lib/supabase/service-client';

// 备用回答生成函数
function generateFallbackAnswer(question: string, documentName: string): string {
  const questionLower = question.toLowerCase();
  
  // 根据问题类型提供智能回答
  if (questionLower.includes('重要') || questionLower.includes('关键') || questionLower.includes('主要')) {
    return `关于文档"${documentName}"中的重要内容，我建议您：

1. 仔细阅读文档的标题和章节标题，这通常包含了最重要的信息
2. 查看文档中的总结、结论或要点部分
3. 注意任何突出显示、加粗或重复提及的内容
4. 关注数字、统计数据和具体的事实信息

由于当前无法直接分析文档内容，建议您重点关注这些部分来获取关键信息。`;
  }
  
  if (questionLower.includes('总结') || questionLower.includes('概括') || questionLower.includes('概述')) {
    return `对于文档"${documentName}"的总结，我建议您：

1. 首先阅读文档的开头和结尾部分，这通常包含主要观点
2. 查看各个章节的小标题，了解文档的整体结构
3. 寻找任何明确标注为"总结"、"结论"或"摘要"的部分
4. 关注作者的主要论点和支持证据

虽然我目前无法直接分析文档内容，但这些方法可以帮助您快速掌握文档的核心要点。`;
  }
  
  if (questionLower.includes('什么') || questionLower.includes('介绍') || questionLower.includes('关于')) {
    return `关于您对文档"${documentName}"的询问，我建议：

1. 从文档标题开始了解主题
2. 阅读前言或介绍部分了解背景
3. 浏览目录了解内容结构
4. 重点关注您感兴趣的特定章节

虽然我暂时无法直接分析文档内容，但我建议您采用这种系统性的阅读方法来获取所需信息。如果有具体问题，您也可以尝试重新提问。`;
  }
  
  // 默认回答
  return `感谢您关于文档"${documentName}"的提问。目前我无法直接分析文档内容，但我建议您：

1. 仔细阅读文档，重点关注标题、小标题和总结部分
2. 查找与您的问题相关的关键词
3. 如果文档较长，可以先浏览目录了解整体结构
4. 对于具体问题，建议重点阅读相关章节

如果您能提供更具体的问题或告诉我您最感兴趣的方面，我可以给出更有针对性的建议。`;
}

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 检查认证，但允许匿名用户使用AI功能
    if (authError || !user?.id) {
      console.log('[PDF QA API] 匿名用户使用AI功能');
    }

    // 解析请求数据
    const { pdfId, question, mode = 'high' } = await request.json();
    
    if (!pdfId || !question) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    console.log(`[PDF QA API] 处理问题，PDF ID: ${pdfId}，问题: "${question}"，模式: ${mode}`);

    // 获取PDF信息
    const query = supabaseService
      .from('pdfs')
      .select('*')
      .eq('id', pdfId);
    
    // 如果用户已登录，只查询属于该用户的PDF；否则查询所有PDF
    if (user?.id) {
      query.eq('user_id', user.id);
    }
    
    let { data: pdf, error: pdfError } = await query.single();
      
    if (pdfError || !pdf) {
      console.log('[PDF QA API] PDF不存在，创建临时文档:', pdfId);
      
      // 创建临时PDF文档以支持聊天
      const { data: newPdf, error: createError } = await supabaseService
        .from('pdfs')
        .insert({
          id: pdfId,
          name: 'Chat Document',
          url: 'temp://chat-document',
          size: 0,
          user_id: user?.id || null
        })
        .select()
        .single();
      
      if (createError || !newPdf) {
        console.error('[PDF QA API] 创建临时PDF失败:', createError);
        return NextResponse.json({ error: 'PDF不存在且无法创建' }, { status: 404 });
      }
      
      pdf = newPdf;
    }

    // 简化版本：直接使用OpenRouter生成回答
    let answer;
    try {
      // 尝试使用RAG系统
      if (!pdfRAGSystem.switchToPDF(pdfId)) {
        console.log('[PDF QA API] PDF未加载，正在加载...');
        await pdfRAGSystem.extractAndChunkPDF(pdf.url, pdfId);
      }
      answer = await pdfRAGSystem.generateAnswer(question, pdf.name, mode as 'high' | 'fast');
    } catch (ragError) {
      console.warn('[PDF QA API] RAG系统失败，使用备用方案:', ragError);
      
      // 备用方案：直接使用OpenRouter
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: mode === 'fast' ? 'deepseek/deepseek-chat' : 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: `你是一个智能文档助手。用户正在查看一个名为"${pdf.name}"的PDF文档，请根据用户的问题给出有帮助的回答。如果无法获取具体文档内容，请提供通用但有价值的建议。请用中文回答。`
            },
            {
              role: 'user',
              content: question
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!openRouterResponse.ok) {
        console.warn(`[PDF QA API] OpenRouter API error: ${openRouterResponse.status}`);
        // 当OpenRouter失败时，提供智能的备用回答
        answer = generateFallbackAnswer(question, pdf.name);
      } else {
        const data = await openRouterResponse.json();
        answer = data.choices[0]?.message?.content || '抱歉，我目前无法回答这个问题。请稍后再试。';
      }
    }
    
    console.log(`[PDF QA API] 答案生成成功，长度: ${answer.length}`);

    return NextResponse.json({ 
      answer,
      pdfId,
      question
    });

  } catch (error) {
    console.error('[PDF QA API] 处理问题失败:', error);
    return NextResponse.json({ 
      error: '处理问题失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 