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

// 备用回答生成函数
function generateFallbackAnswer(question: string, documentName: string): string {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('重要') || questionLower.includes('关键') || questionLower.includes('主要')) {
    return `关于文档"${documentName}"中的重要内容，我建议您：

1. 仔细阅读文档的标题和章节标题，这通常包含了最重要的信息
2. 查看文档中的总结、结论或要点部分
3. 注意任何突出显示、加粗或重复提及的内容
4. 关注数字、统计数据和具体的事实信息

由于当前无法直接分析文档内容，建议您重点关注这些部分来获取关键信息。`;
  }
  
  return `感谢您关于文档"${documentName}"的提问。目前我无法直接分析文档内容，但我建议您：

1. 仔细阅读文档，重点关注标题、小标题和总结部分
2. 查找与您的问题相关的关键词
3. 如果文档较长，可以先浏览目录了解整体结构
4. 对于具体问题，建议重点阅读相关章节

如果您能提供更具体的问题，我可以给出更有针对性的建议。`;
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
    
    let { data: pdf, error: pdfError } = await query.single();
    
    // 如果PDF不存在，尝试创建
    if (pdfError || !pdf) {
      debugSteps.push(createDebugStep('4', 'warning', 'PDF文档未找到，尝试创建', {
        pdfFound: false,
        pdfId: pdfId,
        error: pdfError?.message
      }));

      try {
        const { data: newPdf, error: createError } = await supabaseService
          .from('pdfs')
          .insert({
            id: pdfId,
            name: 'Debug Chat Document',
            url: 'debug://chat-document',
            size: 0,
            user_id: user?.id || null
          })
          .select()
          .single();

        if (createError || !newPdf) {
          debugSteps.push(createDebugStep('4b', 'error', 'PDF文档创建失败', { 
            error: createError?.message 
          }));
          return NextResponse.json({ debugSteps }, { status: 404 });
        }

        pdf = newPdf;
        debugSteps.push(createDebugStep('4b', 'success', 'PDF文档创建成功', {
          pdfId: newPdf.id,
          pdfName: newPdf.name
        }));

      } catch (error) {
        debugSteps.push(createDebugStep('4b', 'error', 'PDF文档创建异常', { 
          error: String(error) 
        }));
        return NextResponse.json({ debugSteps }, { status: 500 });
      }
    } else {
      debugSteps.push(createDebugStep('4', 'success', 'PDF文档找到', {
        pdfFound: true,
        pdfId: pdfId,
        pdfName: pdf?.name
      }));
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
        debugSteps.push(createDebugStep('6b', 'warning', 'OpenRouter失败，使用备用回答', { 
          error: errorText 
        }));
        
        // 使用备用回答
        const answer = generateFallbackAnswer(question, pdf.name);
        
        debugSteps.push(createDebugStep('7', 'success', '备用回答生成成功', {
          answerLength: answer.length,
          method: 'fallback',
          preview: answer.substring(0, 100) + '...'
        }));

        return NextResponse.json({
          success: true,
          answer,
          debugSteps
        });
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