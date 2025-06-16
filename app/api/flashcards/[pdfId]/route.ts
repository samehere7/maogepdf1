import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { pdfId: string } }
) {
  try {
    // 检查用户认证
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { pdfId } = params;

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

    // 获取该PDF的所有闪卡
    const flashcards = await prisma.flashcards.findMany({
      where: {
        pdf_id: pdfId,
        user_id: user.id
      },
      orderBy: [
        { difficulty: 'asc' },
        { created_at: 'desc' }
      ]
    });

    // 计算统计信息
    const stats = flashcards.reduce((acc, card) => {
      acc.total++;
      switch (card.difficulty) {
        case 0:
          acc.new++;
          break;
        case 1:
          acc.easy++;
          break;
        case 2:
          acc.medium++;
          break;
        case 3:
          acc.hard++;
          break;
      }
      return acc;
    }, { total: 0, new: 0, easy: 0, medium: 0, hard: 0 });

    return NextResponse.json({
      flashcards: flashcards.map(card => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        page_number: card.page_number,
        review_count: card.review_count,
        last_reviewed_at: card.last_reviewed_at
      })),
      stats
    });

  } catch (error) {
    console.error('[获取闪卡] 错误:', error);
    return NextResponse.json({ 
      error: '获取闪卡失败' 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { pdfId: string } }
) {
  try {
    // 检查用户认证
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { pdfId } = params;

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

    // 删除该PDF的所有闪卡
    const deletedCount = await prisma.flashcards.deleteMany({
      where: {
        pdf_id: pdfId,
        user_id: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: `已删除${deletedCount.count}张闪卡`
    });

  } catch (error) {
    console.error('[删除闪卡] 错误:', error);
    return NextResponse.json({ 
      error: '删除闪卡失败' 
    }, { status: 500 });
  }
}