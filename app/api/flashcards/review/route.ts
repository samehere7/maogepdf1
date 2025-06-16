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

    const { flashcardId, sessionId, difficultyRating, responseTime } = await req.json();

    if (!flashcardId || !difficultyRating) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证闪卡访问权限
    const flashcard = await prisma.flashcards.findFirst({
      where: {
        id: flashcardId,
        user_id: user.id
      }
    });

    if (!flashcard) {
      return NextResponse.json({ error: '无权访问该闪卡' }, { status: 403 });
    }

    // 记录复习
    const review = await prisma.flashcard_reviews.create({
      data: {
        flashcard_id: flashcardId,
        session_id: sessionId,
        user_id: user.id,
        difficulty_rating: difficultyRating,
        response_time: responseTime || null
      }
    });

    // 更新闪卡的难度和复习信息
    let newDifficulty = flashcard.difficulty;
    
    // 根据用户评分调整难度
    switch (difficultyRating) {
      case 1: // 容易
        newDifficulty = 1;
        break;
      case 2: // 中等
        newDifficulty = 2;
        break;
      case 3: // 困难
        newDifficulty = 3;
        break;
    }

    // 计算下次复习时间（简单的间隔重复算法）
    const now = new Date();
    let nextReviewDays = 1;
    
    switch (newDifficulty) {
      case 1: // 容易 - 7天后复习
        nextReviewDays = 7;
        break;
      case 2: // 中等 - 3天后复习
        nextReviewDays = 3;
        break;
      case 3: // 困难 - 1天后复习
        nextReviewDays = 1;
        break;
    }

    const nextReviewAt = new Date(now.getTime() + nextReviewDays * 24 * 60 * 60 * 1000);

    // 更新闪卡
    const updatedFlashcard = await prisma.flashcards.update({
      where: {
        id: flashcardId
      },
      data: {
        difficulty: newDifficulty,
        last_reviewed_at: now,
        next_review_at: nextReviewAt,
        review_count: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      review,
      flashcard: {
        id: updatedFlashcard.id,
        difficulty: updatedFlashcard.difficulty,
        review_count: updatedFlashcard.review_count,
        next_review_at: updatedFlashcard.next_review_at
      }
    });

  } catch (error) {
    console.error('[记录复习] 错误:', error);
    return NextResponse.json({ 
      error: '记录复习失败' 
    }, { status: 500 });
  }
}