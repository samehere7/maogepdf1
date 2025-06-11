import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getFlashcard, updateFlashcard, deleteFlashcard } from '@/lib/flashcard-service';

// GET - 获取单个闪卡
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const flashcard = await getFlashcard(params.id, session.user.email);
    
    if (!flashcard) {
      return NextResponse.json({ error: '闪卡不存在' }, { status: 404 });
    }

    return NextResponse.json(flashcard);
  } catch (error) {
    console.error('获取闪卡失败:', error);
    return NextResponse.json({ error: '获取闪卡失败' }, { status: 500 });
  }
}

// PUT - 更新闪卡
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { question, answer, difficulty } = await req.json();

    const flashcard = await updateFlashcard(params.id, session.user.email, {
      question,
      answer,
      difficulty,
    });

    return NextResponse.json(flashcard);
  } catch (error) {
    console.error('更新闪卡失败:', error);
    return NextResponse.json({ error: '更新闪卡失败' }, { status: 500 });
  }
}

// DELETE - 删除闪卡
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    await deleteFlashcard(params.id, session.user.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除闪卡失败:', error);
    return NextResponse.json({ error: '删除闪卡失败' }, { status: 500 });
  }
}