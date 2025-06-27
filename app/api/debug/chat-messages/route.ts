import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service-client';
import { prisma } from '@/lib/prisma';

interface DebugStep {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  timestamp: string;
}

function createDebugStep(step: string, status: 'success' | 'error' | 'warning', message: string, data?: any): DebugStep {
  return {
    step,
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  const debugSteps: DebugStep[] = [];
  
  try {
    // 步骤1: 解析请求数据
    debugSteps.push(createDebugStep('1', 'success', '开始调试chat-messages API'));
    
    let requestData;
    try {
      requestData = await request.json();
      debugSteps.push(createDebugStep('2', 'success', '请求数据解析成功', {
        hasDocumentId: !!requestData.documentId,
        hasContent: !!requestData.content,
        isUser: requestData.isUser,
        documentId: requestData.documentId
      }));
    } catch (error) {
      debugSteps.push(createDebugStep('2', 'error', '请求数据解析失败', { error: String(error) }));
      return NextResponse.json({ debugSteps }, { status: 400 });
    }

    const { documentId, content, isUser } = requestData;

    // 步骤3: 检查环境变量
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL
    };
    debugSteps.push(createDebugStep('3', 'success', '环境变量检查完成', envCheck));

    // 步骤4: 测试Supabase用户认证
    let user = null;
    let authError = null;
    try {
      const supabase = createClient();
      const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
      user = authUser;
      authError = authErr;
      
      debugSteps.push(createDebugStep('4', user ? 'success' : 'warning', 
        user ? '用户认证成功' : '用户未认证（匿名用户）', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        authError: authError?.message
      }));
    } catch (error) {
      debugSteps.push(createDebugStep('4', 'error', 'Supabase认证检查失败', { error: String(error) }));
    }

    // 步骤5: 测试Prisma数据库连接
    let prismaWorking = false;
    try {
      await prisma.$connect();
      debugSteps.push(createDebugStep('5', 'success', 'Prisma数据库连接成功'));
      prismaWorking = true;
    } catch (error) {
      debugSteps.push(createDebugStep('5', 'warning', 'Prisma数据库连接失败，将使用Supabase备用方案', { error: String(error) }));
      prismaWorking = false;
    }

    // 步骤5b: 如果Prisma失败，测试Supabase服务角色连接
    if (!prismaWorking) {
      try {
        const { data, error } = await supabaseService
          .from('chat_messages')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        debugSteps.push(createDebugStep('5b', 'success', 'Supabase服务角色连接成功，备用方案可用'));
      } catch (supabaseError) {
        debugSteps.push(createDebugStep('5b', 'error', 'Supabase备用方案也失败', { error: String(supabaseError) }));
        return NextResponse.json({ debugSteps }, { status: 500 });
      }
    }

    // 步骤6: 检查PDF文档是否存在
    let existingPdf = null;
    try {
      if (prismaWorking) {
        existingPdf = await prisma.pdfs.findUnique({
          where: { id: documentId }
        });
      } else {
        const { data } = await supabaseService
          .from('pdfs')
          .select('*')
          .eq('id', documentId)
          .single();
        existingPdf = data;
      }
      
      debugSteps.push(createDebugStep('6', existingPdf ? 'success' : 'warning', 
        existingPdf ? 'PDF文档存在' : 'PDF文档不存在，需要创建', {
        documentExists: !!existingPdf,
        documentId: documentId,
        documentName: existingPdf?.name,
        method: prismaWorking ? 'Prisma' : 'Supabase'
      }));
    } catch (error) {
      debugSteps.push(createDebugStep('6', 'error', 'PDF文档查询失败', { error: String(error) }));
    }

    // 步骤7: 如果需要，创建临时PDF文档
    if (!existingPdf) {
      try {
        let newPdf;
        if (prismaWorking) {
          newPdf = await prisma.pdfs.create({
            data: {
              id: documentId,
              name: 'Debug Chat Session',
              url: 'debug://chat-session',
              size: 0,
              user_id: user?.id || null
            }
          });
        } else {
          const { data, error } = await supabaseService
            .from('pdfs')
            .insert({
              id: documentId,
              name: 'Debug Chat Session',
              url: 'debug://chat-session',
              size: 0,
              user_id: user?.id || null
            })
            .select()
            .single();
          
          if (error) throw error;
          newPdf = data;
        }
        
        debugSteps.push(createDebugStep('7', 'success', '临时PDF文档创建成功', {
          pdfId: newPdf.id,
          pdfName: newPdf.name,
          method: prismaWorking ? 'Prisma' : 'Supabase'
        }));
      } catch (error) {
        debugSteps.push(createDebugStep('7', 'error', '临时PDF文档创建失败', { error: String(error) }));
        return NextResponse.json({ debugSteps }, { status: 500 });
      }
    } else {
      debugSteps.push(createDebugStep('7', 'success', '跳过PDF创建，文档已存在'));
    }

    // 步骤8: 测试聊天消息插入
    try {
      let message;
      if (prismaWorking) {
        message = await prisma.chat_messages.create({
          data: {
            user_id: user?.id || null,
            document_id: documentId,
            content: content,
            is_user: isUser || false
          }
        });
      } else {
        const { data, error } = await supabaseService
          .from('chat_messages')
          .insert({
            user_id: user?.id || null,
            document_id: documentId,
            content: content,
            is_user: isUser || false
          })
          .select()
          .single();
        
        if (error) throw error;
        message = data;
      }
      
      debugSteps.push(createDebugStep('8', 'success', '聊天消息保存成功', {
        messageId: message.id,
        userId: message.user_id,
        documentId: message.document_id,
        isUser: message.is_user,
        method: prismaWorking ? 'Prisma' : 'Supabase'
      }));

      // 步骤9: 验证消息是否能查询到
      let savedMessage;
      if (prismaWorking) {
        savedMessage = await prisma.chat_messages.findUnique({
          where: { id: message.id }
        });
      } else {
        const { data } = await supabaseService
          .from('chat_messages')
          .select('*')
          .eq('id', message.id)
          .single();
        savedMessage = data;
      }
      
      debugSteps.push(createDebugStep('9', savedMessage ? 'success' : 'error', 
        savedMessage ? '消息查询验证成功' : '消息查询验证失败', {
        messageFound: !!savedMessage,
        method: prismaWorking ? 'Prisma' : 'Supabase'
      }));

      return NextResponse.json({
        success: true,
        messageId: message.id,
        debugSteps
      });

    } catch (error) {
      debugSteps.push(createDebugStep('8', 'error', '聊天消息保存失败', { 
        error: String(error),
        errorCode: (error as any)?.code,
        errorMeta: (error as any)?.meta
      }));
      return NextResponse.json({ debugSteps }, { status: 500 });
    }

  } catch (error) {
    debugSteps.push(createDebugStep('unknown', 'error', '未知错误', { error: String(error) }));
    return NextResponse.json({ debugSteps }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      debugSteps.push(createDebugStep('cleanup', 'warning', 'Prisma断开连接失败', { error: String(error) }));
    }
  }
}

// 获取调试信息的GET端点
export async function GET(request: NextRequest) {
  const debugSteps: DebugStep[] = [];
  
  try {
    // 基本系统信息
    debugSteps.push(createDebugStep('system', 'success', '系统信息检查', {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }));

    // 环境变量检查
    const envStatus = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: !!process.env.DATABASE_URL
    };
    debugSteps.push(createDebugStep('env', 'success', '环境变量状态', envStatus));

    // 数据库连接测试
    try {
      await prisma.$connect();
      debugSteps.push(createDebugStep('db', 'success', '数据库连接正常'));
      
      // 测试基本查询
      const messageCount = await prisma.chat_messages.count();
      debugSteps.push(createDebugStep('db-query', 'success', '数据库查询测试成功', {
        totalMessages: messageCount
      }));
      
    } catch (error) {
      debugSteps.push(createDebugStep('db', 'error', '数据库连接失败', { error: String(error) }));
    }

    // Supabase认证测试
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      debugSteps.push(createDebugStep('auth', user ? 'success' : 'warning', 
        user ? '用户已认证' : '用户未认证', {
        hasUser: !!user,
        userId: user?.id,
        authError: authError?.message
      }));
    } catch (error) {
      debugSteps.push(createDebugStep('auth', 'error', 'Supabase认证测试失败', { error: String(error) }));
    }

    return NextResponse.json({
      status: 'healthy',
      debugSteps
    });

  } catch (error) {
    debugSteps.push(createDebugStep('system', 'error', '系统检查失败', { error: String(error) }));
    return NextResponse.json({ debugSteps }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // 忽略断开连接错误
    }
  }
}