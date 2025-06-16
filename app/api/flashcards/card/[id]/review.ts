import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { reviewFlashcard } from '@/lib/flashcard-service';

// POST - 复习闪卡
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { rating } = await req.json();

    if (!['EASY', 'MEDIUM', 'HARD', 'AGAIN'].includes(rating)) {
      return NextResponse.json({ error: '无效的评分' }, { status: 400 });
    }

    const review = await reviewFlashcard(params.id, { rating });
    return NextResponse.json(review);
  } catch (error) {
    console.error('复习闪卡失败:', error);
    return NextResponse.json({ error: '复习闪卡失败' }, { status: 500 });
  }
}