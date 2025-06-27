import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service-client';
import { prisma } from '@/lib/prisma';

// 获取聊天消息
export async function GET(request: NextRequest) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // 检查认证，但允许匿名用户查询聊天记录
    if (authError || !user?.id) {
      console.log('[Chat Messages API] 匿名用户查询聊天记录');
      // 允许匿名用户查询聊天记录
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
    
    // 检查认证，但允许匿名用户使用聊天功能
    if (authError || !user?.id) {
      console.log('[Chat Messages API] 匿名用户使用聊天功能');
      // 在生产环境中，我们允许匿名用户使用聊天功能，但会有一些限制
    }

    const { documentId, content, isUser } = await request.json();
    
    if (!documentId || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const userId = user?.id || 'anonymous';
    console.log('[Chat Messages API] 保存聊天消息，文档ID:', documentId, '用户:', userId, '是否用户消息:', isUser);

    // 确保PDF文档存在，如果不存在则创建临时文档
    const existingPdf = await prisma.pdfs.findUnique({
      where: { id: documentId }
    });
    
    if (!existingPdf) {
      console.log('[Chat Messages API] 创建临时PDF文档，ID:', documentId);
      try {
        await prisma.pdfs.create({
          data: {
            id: documentId,
            name: 'Chat Session Document',
            url: 'temp://chat-session',
            size: 0,
            user_id: user?.id || null
          }
        });
      } catch (createError) {
        console.error('[Chat Messages API] 创建PDF文档失败:', createError);
        // 如果创建失败，可能是ID冲突，继续执行
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