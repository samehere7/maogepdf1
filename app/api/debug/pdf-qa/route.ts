import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service-client';

// 获取多语言系统提示词
function getSystemPromptByLocale(locale: string, pdfName: string): string {
  const prompts = {
    'zh': `你是一个智能文档助手。用户正在查看一个名为"${pdfName}"的PDF文档，请根据用户的问题给出有帮助的回答。请用中文回答。`,
    'en': `You are an intelligent document assistant. The user is viewing a PDF document named "${pdfName}". Please provide helpful answers based on the user's questions. Please respond in English.`,
    'ja': `あなたは賢い文書アシスタントです。ユーザーは「${pdfName}」というPDF文書を見ています。ユーザーの質問に基づいて役立つ回答を提供してください。日本語で回答してください。`,
    'ko': `당신은 지능적인 문서 도우미입니다. 사용자가 "${pdfName}"라는 PDF 문서를 보고 있습니다. 사용자의 질문에 따라 도움이 되는 답변을 제공해 주세요. 한국어로 답변해 주세요.`,
    'es': `Eres un asistente inteligente de documentos. El usuario está viendo un documento PDF llamado "${pdfName}". Proporciona respuestas útiles basadas en las preguntas del usuario. Por favor responde en español.`,
    'fr': `Vous êtes un assistant intelligent de documents. L'utilisateur consulte un document PDF nommé "${pdfName}". Veuillez fournir des réponses utiles basées sur les questions de l'utilisateur. Veuillez répondre en français.`,
    'de': `Sie sind ein intelligenter Dokumentenassistent. Der Benutzer betrachtet ein PDF-Dokument namens "${pdfName}". Bitte geben Sie hilfreiche Antworten basierend auf den Fragen des Benutzers. Bitte antworten Sie auf Deutsch.`,
    'it': `Sei un assistente intelligente per documenti. L'utente sta visualizzando un documento PDF chiamato "${pdfName}". Fornisci risposte utili basate sulle domande dell'utente. Si prega di rispondere in italiano.`,
    'pt-BR': `Você é um assistente inteligente de documentos. O usuário está visualizando um documento PDF chamado "${pdfName}". Forneça respostas úteis baseadas nas perguntas do usuário. Por favor, responda em português.`,
    'ru': `Вы - умный помощник по документам. Пользователь просматривает PDF-документ под названием "${pdfName}". Пожалуйста, предоставьте полезные ответы на основе вопросов пользователя. Пожалуйста, отвечайте на русском языке.`
  };
  
  return prompts[locale as keyof typeof prompts] || prompts['en'];
}

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

    const { pdfId, question, mode = 'fast', locale = 'zh' } = requestData;

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
              content: getSystemPromptByLocale(locale, pdf.name)
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
        debugSteps.push(createDebugStep('6b', 'error', 'OpenRouter API失败', { 
          error: errorText,
          status: openRouterResponse.status
        }));
        
        return NextResponse.json({ 
          success: false,
          error: 'AI服务暂时不可用',
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