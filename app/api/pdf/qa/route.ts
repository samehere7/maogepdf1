import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';
import { supabaseService } from '@/lib/supabase/service-client';

// 获取多语言系统提示词
function getSystemPromptByLocale(locale: string, pdfName: string): string {
  const prompts = {
    'zh': `你是一个智能文档助手。用户正在查看一个名为"${pdfName}"的PDF文档，请根据用户的问题给出有帮助的回答。如果无法获取具体文档内容，请提供通用但有价值的建议。请用中文回答。`,
    'en': `You are an intelligent document assistant. The user is viewing a PDF document named "${pdfName}". Please provide helpful answers based on the user's questions. If you cannot access specific document content, please provide general but valuable advice. Please respond in English.`,
    'ja': `あなたは賢い文書アシスタントです。ユーザーは「${pdfName}」というPDF文書を見ています。ユーザーの質問に基づいて役立つ回答を提供してください。具体的な文書内容にアクセスできない場合は、一般的だが価値のあるアドバイスを提供してください。日本語で回答してください。`,
    'ko': `당신은 지능적인 문서 도우미입니다. 사용자가 "${pdfName}"라는 PDF 문서를 보고 있습니다. 사용자의 질문에 따라 도움이 되는 답변을 제공해 주세요. 구체적인 문서 내용에 접근할 수 없다면 일반적이지만 가치 있는 조언을 제공해 주세요. 한국어로 답변해 주세요.`,
    'es': `Eres un asistente inteligente de documentos. El usuario está viendo un documento PDF llamado "${pdfName}". Proporciona respuestas útiles basadas en las preguntas del usuario. Si no puedes acceder al contenido específico del documento, proporciona consejos generales pero valiosos. Por favor responde en español.`,
    'fr': `Vous êtes un assistant intelligent de documents. L'utilisateur consulte un document PDF nommé "${pdfName}". Veuillez fournir des réponses utiles basées sur les questions de l'utilisateur. Si vous ne pouvez pas accéder au contenu spécifique du document, veuillez fournir des conseils généraux mais précieux. Veuillez répondre en français.`,
    'de': `Sie sind ein intelligenter Dokumentenassistent. Der Benutzer betrachtet ein PDF-Dokument namens "${pdfName}". Bitte geben Sie hilfreiche Antworten basierend auf den Fragen des Benutzers. Wenn Sie nicht auf spezifische Dokumentinhalte zugreifen können, geben Sie allgemeine aber wertvolle Ratschläge. Bitte antworten Sie auf Deutsch.`,
    'it': `Sei un assistente intelligente per documenti. L'utente sta visualizzando un documento PDF chiamato "${pdfName}". Fornisci risposte utili basate sulle domande dell'utente. Se non puoi accedere al contenuto specifico del documento, fornisci consigli generali ma preziosi. Si prega di rispondere in italiano.`,
    'pt-BR': `Você é um assistente inteligente de documentos. O usuário está visualizando um documento PDF chamado "${pdfName}". Forneça respostas úteis baseadas nas perguntas do usuário. Se não conseguir acessar o conteúdo específico do documento, forneça conselhos gerais mas valiosos. Por favor, responda em português.`,
    'ru': `Вы - умный помощник по документам. Пользователь просматривает PDF-документ под названием "${pdfName}". Пожалуйста, предоставьте полезные ответы на основе вопросов пользователя. Если вы не можете получить доступ к конкретному содержимому документа, предоставьте общие, но ценные советы. Пожалуйста, отвечайте на русском языке.`
  };
  
  return prompts[locale as keyof typeof prompts] || prompts['en'];
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
    const { pdfId, question, mode = 'high', locale = 'zh' } = await request.json();
    
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
      answer = await pdfRAGSystem.generateAnswer(question, pdf.name, mode as 'high' | 'fast', locale);
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

      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error(`[PDF QA API] OpenRouter API error: ${openRouterResponse.status} - ${errorText}`);
        throw new Error(`AI服务暂时不可用: ${openRouterResponse.status}`);
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