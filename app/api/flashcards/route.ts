import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createFlashcard, getUserFlashcards, getFlashcardStats } from '@/lib/flashcard-service';

// GET - 获取用户的闪卡
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const url = new URL(req.url);
    const pdfId = url.searchParams.get('pdfId');
    const statsOnly = url.searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getFlashcardStats(session.user.email, pdfId || undefined);
      return NextResponse.json(stats);
    }

    const flashcards = await getUserFlashcards(session.user.email, pdfId || undefined);
    return NextResponse.json(flashcards);
  } catch (error) {
    console.error('获取闪卡失败:', error);
    return NextResponse.json({ error: '获取闪卡失败' }, { status: 500 });
  }
}

// POST - 创建闪卡
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { question, answer, pdfId, difficulty } = await req.json();

    if (!question || !answer || !pdfId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const flashcard = await createFlashcard({
      question,
      answer,
      pdfId,
      userId: session.user.email,
      difficulty,
    });

    return NextResponse.json(flashcard);
  } catch (error) {
    console.error('创建闪卡失败:', error);
    return NextResponse.json({ error: '创建闪卡失败' }, { status: 500 });
  }
}