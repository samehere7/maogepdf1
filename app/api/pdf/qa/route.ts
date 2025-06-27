import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';
import { supabaseService } from '@/lib/supabase/service-client';

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
        throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
      }

      const data = await openRouterResponse.json();
      answer = data.choices[0]?.message?.content || '抱歉，我目前无法回答这个问题。请稍后再试。';
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