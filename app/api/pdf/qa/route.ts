import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';
import { supabaseService } from '@/lib/supabase/service-client';

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 解析请求数据
    const { pdfId, question, mode = 'high' } = await request.json();
    
    if (!pdfId || !question) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    console.log(`[PDF QA API] 处理问题，PDF ID: ${pdfId}，问题: "${question}"，模式: ${mode}`);

    // 获取PDF信息
    const { data: pdf, error: pdfError } = await supabaseService
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .eq('user_id', user.id)
      .single();
      
    if (pdfError || !pdf) {
      console.error('[PDF QA API] 获取PDF信息失败:', pdfError);
      return NextResponse.json({ error: 'PDF不存在或无权访问' }, { status: 404 });
    }

    // 确保PDF已加载到RAG系统
    if (!pdfRAGSystem.switchToPDF(pdfId)) {
      console.log('[PDF QA API] PDF未加载，正在加载...');
      await pdfRAGSystem.extractAndChunkPDF(pdf.url, pdfId);
    }

    // 根据模式生成答案
    const answer = await pdfRAGSystem.generateAnswer(question, pdf.name, mode as 'high' | 'fast');
    
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