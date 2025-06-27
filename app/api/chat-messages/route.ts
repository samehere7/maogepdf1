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
    let messages;
    try {
      // 首先尝试使用Prisma
      const whereClause = user?.id 
        ? { document_id: documentId, user_id: user.id }
        : { document_id: documentId, user_id: null };
      
      messages = await prisma.chat_messages.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'asc'
        }
      });
    } catch (prismaError) {
      console.warn('[Chat Messages API] Prisma查询失败，尝试使用Supabase客户端:', prismaError);
      
      // 如果Prisma失败，使用Supabase客户端
      const query = supabaseService
        .from('chat_messages')
        .select('*')
        .eq('document_id', documentId)
        .order('timestamp', { ascending: true });
      
      if (user?.id) {
        query.eq('user_id', user.id);
      } else {
        query.is('user_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[Chat Messages API] Supabase查询也失败:', error);
        throw error;
      }
      
      messages = data || [];
    }
    
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
    let existingPdf;
    let message;
    
    try {
      // 首先尝试使用Prisma
      existingPdf = await prisma.pdfs.findUnique({
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
        }
      }

      // 保存到数据库
      message = await prisma.chat_messages.create({
        data: {
          user_id: user?.id || null,
          document_id: documentId,
          content: content,
          is_user: isUser || false
        }
      });
      
    } catch (prismaError) {
      console.warn('[Chat Messages API] Prisma操作失败，尝试使用Supabase客户端:', prismaError);
      
      // 如果Prisma失败，使用Supabase客户端
      // 首先检查PDF是否存在
      const { data: pdfData } = await supabaseService
        .from('pdfs')
        .select('id')
        .eq('id', documentId)
        .single();
      
      if (!pdfData) {
        console.log('[Chat Messages API] 使用Supabase创建临时PDF文档');
        await supabaseService
          .from('pdfs')
          .insert({
            id: documentId,
            name: 'Chat Session Document',
            url: 'temp://chat-session',
            size: 0,
            user_id: user?.id || null
          });
      }
      
      // 保存消息
      const { data: messageData, error: messageError } = await supabaseService
        .from('chat_messages')
        .insert({
          user_id: user?.id || null,
          document_id: documentId,
          content: content,
          is_user: isUser || false
        })
        .select()
        .single();
      
      if (messageError) {
        console.error('[Chat Messages API] Supabase消息保存失败:', messageError);
        throw messageError;
      }
      
      message = messageData;
    }
    
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