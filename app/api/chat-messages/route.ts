import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// 获取聊天消息
export async function GET(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 开发环境下允许匿名用户，生产环境仍需要认证
    if (authError || !user?.id) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
      }
      console.log('[Chat Messages API] 开发环境：允许匿名用户查询');
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json({ error: '缺少文档ID' }, { status: 400 });
    }

    const userId = user?.id || 'anonymous';
    console.log('[Chat Messages API] 获取聊天记录，文档ID:', documentId, '用户:', userId);

    // 从数据库获取聊天消息
    const whereClause = user?.id 
      ? { document_id: documentId, user_id: user.id }
      : { document_id: documentId, user_id: null }; // 开发环境查询匿名消息
    
    const messages = await prisma.chat_messages.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'asc'
      }
    });
    
    console.log('[Chat Messages API] 找到消息数量:', messages.length);

    // 转换为前端期望的格式
    const formattedMessages = messages.map(msg => ({
      role: msg.is_user ? 'user' : 'assistant',
      content: msg.content
    }));

    return NextResponse.json({ 
      messages: formattedMessages 
    });

  } catch (error) {
    console.error('[Chat Messages API] 获取聊天记录失败:', error);
    return NextResponse.json({ 
      error: '获取聊天记录失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 保存聊天消息
export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 开发环境下允许匿名用户，生产环境仍需要认证
    if (authError || !user?.id) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: '未登录' }, { status: 401 });
      }
      console.log('[Chat Messages API] 开发环境：允许匿名用户操作');
    }

    const { documentId, content, isUser } = await request.json();
    
    if (!documentId || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const userId = user?.id || 'anonymous';
    console.log('[Chat Messages API] 保存聊天消息，文档ID:', documentId, '用户:', userId, '是否用户消息:', isUser);

    // 开发环境下，确保PDF文档存在
    if (process.env.NODE_ENV !== 'production') {
      const existingPdf = await prisma.pdfs.findUnique({
        where: { id: documentId }
      });
      
      if (!existingPdf) {
        console.log('[Chat Messages API] 开发环境：创建临时PDF文档');
        await prisma.pdfs.create({
          data: {
            id: documentId,
            name: 'Temporary PDF for Chat',
            url: 'temp://chat-pdf',
            size: 0,
            user_id: user?.id || null
          }
        });
      }
    }

    // 保存到数据库
    const message = await prisma.chat_messages.create({
      data: {
        user_id: user?.id || null, // 允许null值
        document_id: documentId,
        content: content,
        is_user: isUser || false
      }
    });
    
    console.log('[Chat Messages API] 消息保存成功，ID:', message.id);

    return NextResponse.json({ 
      message: '消息保存成功',
      id: message.id
    });

  } catch (error) {
    console.error('[Chat Messages API] 保存聊天消息失败:', error);
    return NextResponse.json({ 
      error: '保存聊天消息失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}