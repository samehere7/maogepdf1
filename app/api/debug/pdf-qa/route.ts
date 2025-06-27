import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service-client';

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
    debugSteps.push(createDebugStep('1', 'success', '开始调试PDF QA API'));

    // 解析请求
    let requestData;
    try {
      requestData = await request.json();
      debugSteps.push(createDebugStep('2', 'success', '请求数据解析成功', requestData));
    } catch (error) {
      debugSteps.push(createDebugStep('2', 'error', '请求数据解析失败', { error: String(error) }));
      return NextResponse.json({ debugSteps }, { status: 400 });
    }

    const { pdfId, question, mode = 'fast' } = requestData;

    // 检查认证
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    debugSteps.push(createDebugStep('3', user ? 'success' : 'warning', 
      user ? '用户已认证' : '匿名用户', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    }));

    // 查找PDF
    const query = supabaseService
      .from('pdfs')
      .select('*')
      .eq('id', pdfId);
    
    if (user?.id) {
      query.eq('user_id', user.id);
    }
    
    const { data: pdf, error: pdfError } = await query.single();
    
    debugSteps.push(createDebugStep('4', pdf ? 'success' : 'error', 
      pdf ? 'PDF文档找到' : 'PDF文档未找到', {
      pdfFound: !!pdf,
      pdfId: pdfId,
      pdfName: pdf?.name,
      error: pdfError?.message
    }));

    if (!pdf) {
      return NextResponse.json({ debugSteps }, { status: 404 });
    }

    // 测试OpenRouter直接调用
    debugSteps.push(createDebugStep('5', 'success', '开始测试OpenRouter API'));

    try {
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
              content: `你是一个智能文档助手。用户正在查看一个名为"${pdf.name}"的PDF文档，请根据用户的问题给出有帮助的回答。请用中文回答。`
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

      debugSteps.push(createDebugStep('6', openRouterResponse.ok ? 'success' : 'error', 
        `OpenRouter响应: ${openRouterResponse.status}`, {
        status: openRouterResponse.status,
        statusText: openRouterResponse.statusText,
        headers: Object.fromEntries(openRouterResponse.headers.entries())
      }));

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        debugSteps.push(createDebugStep('6b', 'error', 'OpenRouter错误详情', { 
          error: errorText 
        }));
        return NextResponse.json({ debugSteps }, { status: 500 });
      }

      const data = await openRouterResponse.json();
      const answer = data.choices[0]?.message?.content || '无法生成回答';

      debugSteps.push(createDebugStep('7', 'success', 'AI回答生成成功', {
        answerLength: answer.length,
        model: mode === 'fast' ? 'deepseek/deepseek-chat' : 'anthropic/claude-3.5-sonnet',
        preview: answer.substring(0, 100) + '...'
      }));

      return NextResponse.json({
        success: true,
        answer,
        debugSteps
      });

    } catch (error) {
      debugSteps.push(createDebugStep('5', 'error', 'OpenRouter调用失败', { 
        error: String(error) 
      }));
      return NextResponse.json({ debugSteps }, { status: 500 });
    }

  } catch (error) {
    debugSteps.push(createDebugStep('unknown', 'error', '未知错误', { error: String(error) }));
    return NextResponse.json({ debugSteps }, { status: 500 });
  }
}