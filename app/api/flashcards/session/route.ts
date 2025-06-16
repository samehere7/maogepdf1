import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // 检查用户认证
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { pdfId, totalCards } = await req.json();

    if (!pdfId) {
      return NextResponse.json({ error: '缺少PDF ID' }, { status: 400 });
    }

    // 验证PDF访问权限
    const pdf = await prisma.pdfs.findFirst({
      where: {
        id: pdfId,
        user_id: user.id
      }
    });

    if (!pdf) {
      return NextResponse.json({ error: '无权访问该PDF' }, { status: 403 });
    }

    // 创建学习会话
    const session = await prisma.flashcard_sessions.create({
      data: {
        pdf_id: pdfId,
        user_id: user.id,
        cards_studied: 0,
        cards_easy: 0,
        cards_medium: 0,
        cards_hard: 0
      }
    });

    return NextResponse.json({
      sessionId: session.id,
      message: '学习会话已创建'
    });

  } catch (error) {
    console.error('[创建学习会话] 错误:', error);
    return NextResponse.json({ 
      error: '创建学习会话失败' 
    }, { status: 500 });
  }
}