import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    // 检查用户认证
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { sessionId } = params;
    const { easyCount, mediumCount, hardCount, endTime, totalCards } = await req.json();

    // 验证会话访问权限
    const session = await prisma.flashcard_sessions.findFirst({
      where: {
        id: sessionId,
        user_id: user.id
      }
    });

    if (!session) {
      return NextResponse.json({ error: '无权访问该会话' }, { status: 403 });
    }

    // 更新会话数据
    const updatedSession = await prisma.flashcard_sessions.update({
      where: {
        id: sessionId
      },
      data: {
        cards_studied: totalCards || (easyCount + mediumCount + hardCount),
        cards_easy: easyCount || 0,
        cards_medium: mediumCount || 0,
        cards_hard: hardCount || 0,
        end_time: endTime ? new Date(endTime) : new Date()
      }
    });

    return NextResponse.json({
      success: true,
      session: updatedSession
    });

  } catch (error) {
    console.error('[更新学习会话] 错误:', error);
    return NextResponse.json({ 
      error: '更新学习会话失败' 
    }, { status: 500 });
  }
}