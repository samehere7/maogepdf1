import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadPDF } from '@/lib/pdf-service-supabase';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';
import { supabaseService } from '@/lib/supabase/service-client';

// 配置API路由选项，增加请求体大小限制
export const maxDuration = 300; // 5分钟超时
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 用户限制配置
const FREE_USER_PDF_LIMIT = 3; // PDF总数限制
const FREE_USER_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB文件大小限制
const FREE_USER_MAX_PAGES = 120; // 免费用户页数限制

const PLUS_USER_MAX_PAGES = 2000; // Plus用户页数限制

// 处理Storage直传后的数据库记录创建
async function handleStorageUploadRecord(req: Request) {
  try {
    const body = await req.json();
    const { fileName, fileUrl, fileSize, quality, storageUpload } = body;
    
    console.log('[Storage Upload] 处理数据库记录创建:', { fileName, fileSize, quality });
    
    // 认证检查
    let user = null;
    let authMethod = '';
    
    // 方案1: 尝试从服务端cookie获取用户认证
    try {
      const supabase = createClient();
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
      if (cookieUser && !cookieError) {
        user = cookieUser;
        authMethod = 'cookie';
        console.log('[Storage Upload] Cookie认证成功:', user.email);
      }
    } catch (cookieError) {
      console.log('[Storage Upload] Cookie认证失败:', cookieError);
    }
    
    // 方案2: 如果cookie认证失败，尝试从Authorization header获取token
    if (!user) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { createClient: createAuthClient } = await import('@supabase/supabase-js');
          const authClient = createAuthClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          const { data: { user: tokenUser }, error: tokenError } = await authClient.auth.getUser(token);
          if (tokenUser && !tokenError) {
            user = tokenUser;
            authMethod = 'token';
            console.log('[Storage Upload] Token认证成功:', user.email);
          }
        } catch (tokenError) {
          console.log('[Storage Upload] Token认证失败:', tokenError);
        }
      }
    }
    
    if (!user?.id || !user?.email) {
      console.log('[Storage Upload] 用户未登录或认证失败');
      return NextResponse.json({ 
        error: '未登录或认证失败',
        details: '请先登录后再上传文件。如果已登录，请刷新页面重试。',
        authMethod: authMethod || 'none'
      }, { status: 401 });
    }
    
    const userId = user.id;
    const userEmail = user.email;
    console.log('[Storage Upload] 用户已登录:', userEmail, '用户ID:', userId, '认证方式:', authMethod);

    // 确保用户在数据库中存在
    const { data: userExists } = await supabaseService
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!userExists) {
      console.log('[Storage Upload] 用户在数据库中不存在，创建用户记录');
      const { error: createUserError } = await supabaseService
        .from('user_profiles')
        .insert({
          id: userId,
          email: userEmail,
          name: user.user_metadata?.name || userEmail.split('@')[0]
        });
      
      if (createUserError) {
        console.error('[Storage Upload] 创建用户记录失败:', createUserError);
      } else {
        console.log('[Storage Upload] 用户记录已创建');
      }
    }

    // 检查用户Plus状态
    let isPlus = false;
    let isActive = true;
    
    const { data: userProfile } = await supabaseService
      .from('user_profiles')
      .select('plus, is_active')
      .eq('id', userId)
      .single();
    
    isPlus = userProfile?.plus || false;
    isActive = userProfile?.is_active !== false;
      
    // 非Plus用户的上传数量限制检查
    if (!isPlus || !isActive) {
      const { data: pdfCount } = await supabaseService
        .from('pdfs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
        
      const count = pdfCount?.length || 0;
      if (count >= FREE_USER_PDF_LIMIT) {
        return NextResponse.json({ 
          error: '免费用户最多上传3个PDF文件，请升级到Plus会员解锁无限上传', 
          code: 'LIMIT_EXCEEDED' 
        }, { status: 403 });
      }
    }

    // 检查文件大小（免费用户限制为10MB，Plus用户无限制）
    const fileSizeMB = Math.round((fileSize / 1024 / 1024) * 100) / 100;
    console.log(`[Storage Upload] 文件大小检查: ${fileName}, 大小: ${fileSize} bytes (${fileSizeMB}MB), isPlus: ${isPlus}, isActive: ${isActive}`);
    
    if (!isPlus || !isActive) {
      console.log(`[Storage Upload] 非Plus用户，检查大小限制: ${fileSize} > ${FREE_USER_MAX_FILE_SIZE} = ${fileSize > FREE_USER_MAX_FILE_SIZE}`);
      if (fileSize > FREE_USER_MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: '免费用户文件大小限制为10MB，请升级到Plus会员解锁无限制上传', 
          code: 'FILE_TOO_LARGE_FREE',
          details: `文件大小: ${fileSizeMB}MB, 限制: 10MB`,
          fileSize: fileSize,
          fileSizeMB: fileSizeMB,
          maxSize: FREE_USER_MAX_FILE_SIZE
        }, { status: 400 });
      }
    } else {
      console.log(`[Storage Upload] Plus用户，无大小限制`);
    }

    // 创建PDF记录
    console.log('[Storage Upload] 创建数据库记录');
    const { data: pdf, error: pdfCreateError } = await supabaseService
      .from('pdfs')
      .insert({
        name: fileName,
        url: fileUrl,
        size: fileSize,
        user_id: userId,
        summary: fileName
      })
      .select()
      .single();
    
    if (pdfCreateError) {
      console.error('[Storage Upload] 创建PDF记录失败:', pdfCreateError);
      throw new Error('数据库记录创建失败: ' + pdfCreateError.message);
    }
    
    console.log('[Storage Upload] 数据库记录创建成功，PDF ID:', pdf.id);
    
    // 后台处理PDF到RAG系统（不阻塞响应）
    processPDFToRAGSystem(pdf.id, fileName, fileUrl, quality).catch(error => {
      console.error('[Storage Upload] RAG系统处理失败:', error);
    });
    
    return NextResponse.json({
      message: '文件上传成功',
      pdf: pdf,
      url: fileUrl
    });
    
  } catch (error) {
    console.error('[Storage Upload] 处理失败:', error);
    const errorMessage = error instanceof Error ? error.message : '数据库记录创建失败';
    return NextResponse.json({ 
      error: errorMessage,
      code: error instanceof Error ? error.name : 'DB_RECORD_ERROR'
    }, { status: 500 });
  }
}


// 异步处理PDF到RAG系统
async function processPDFToRAGSystem(pdfId: string, fileName: string, pdfUrl: string, quality: string = 'high'): Promise<void> {
  try {
    console.log('[RAG处理] 开始处理PDF到RAG系统:', fileName, 'ID:', pdfId, '质量模式:', quality);
    
    // 处理PDF文档到RAG系统，传入PDF ID
    await pdfRAGSystem.extractAndChunkPDF(pdfUrl, pdfId);
    
    // 将质量模式保存到数据库
    const { error } = await supabaseService
      .from('pdfs')
      .update({ quality_mode: quality })
      .eq('id', pdfId);
      
    if (error) {
      console.error('[RAG处理] 更新质量模式失败:', error);
    }
    
    console.log('[RAG处理] PDF成功添加到RAG系统:', fileName, 'ID:', pdfId);
  } catch (error) {
    console.error('[RAG处理] 处理失败:', error);
    // 这里可以选择将错误记录到数据库或者重试队列
  }
}

export async function POST(req: Request) {
  try {
    // 检查是否为Storage直传后的数据库创建请求
    const contentType = req.headers.get('content-type');
    const isStorageUpload = contentType?.includes('application/json');
    
    if (isStorageUpload) {
      console.log('[Upload API] 处理Storage直传后的数据库记录创建请求');
      return await handleStorageUploadRecord(req);
    }
    
    // 原有的FormData文件上传逻辑（保留向后兼容）
    console.log('[Upload API] 处理传统FormData文件上传');
    
    // 检查Content-Length头以诊断413错误
    const contentLength = req.headers.get('content-length');
    console.log('[Upload API] Content-Length:', contentLength);
    
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB限制
      return NextResponse.json({
        error: '文件过大',
        details: `文件大小 ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB 超过50MB限制`,
        maxSize: '50MB'
      }, { status: 413 });
    }
    // 方案1: 尝试从服务端cookie获取用户认证
    let user = null;
    let authMethod = '';
    
    try {
      const supabase = createClient();
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
      if (cookieUser && !cookieError) {
        user = cookieUser;
        authMethod = 'cookie';
        console.log('[Upload API] Cookie认证成功:', user.email);
      }
    } catch (cookieError) {
      console.log('[Upload API] Cookie认证失败:', cookieError);
    }
    
    // 方案2: 如果cookie认证失败，尝试从Authorization header获取token
    if (!user) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { createClient: createAuthClient } = await import('@supabase/supabase-js');
          const authClient = createAuthClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          const { data: { user: tokenUser }, error: tokenError } = await authClient.auth.getUser(token);
          if (tokenUser && !tokenError) {
            user = tokenUser;
            authMethod = 'token';
            console.log('[Upload API] Token认证成功:', user.email);
          }
        } catch (tokenError) {
          console.log('[Upload API] Token认证失败:', tokenError);
        }
      }
    }
    
    if (!user?.id || !user?.email) {
      console.log('[Upload API] 用户未登录或认证失败，拒绝上传');
      
      // 详细的调试信息
      const debugInfo = {
        cookiesPresent: !!req.headers.get('cookie'),
        authHeaderPresent: !!req.headers.get('authorization'),
        userFound: !!user,
        userEmail: user?.email || null,
        authMethod: authMethod || 'none',
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json({ 
        error: '未登录或认证失败',
        details: '请先登录后再上传文件。如果已登录，请刷新页面重试。',
        authMethod: authMethod || 'none',
        debug: debugInfo
      }, { status: 401 });
    }
    
    const userId = user.id;
    const userEmail = user.email;
    console.log('[Upload API] 用户已登录:', userEmail, '用户ID:', userId, '认证方式:', authMethod);

    // 确保用户在数据库中存在 - 使用Supabase客户端
    const { data: userExists } = await supabaseService
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!userExists) {
      console.log('[Upload API] 用户在数据库中不存在，创建用户记录');
      const { error: createUserError } = await supabaseService
        .from('user_profiles')
        .insert({
          id: userId,
          email: userEmail,
          name: user.user_metadata?.name || userEmail.split('@')[0]
        });
      
      if (createUserError) {
        console.error('[Upload API] 创建用户记录失败:', createUserError);
      } else {
        console.log('[Upload API] 用户记录已创建');
      }
    }

    // 检查用户Plus状态
    let isPlus = false;
    let isActive = true;
    
    // 直接从user_profiles表获取用户Plus状态
    const { data: userProfile } = await supabaseService
      .from('user_profiles')
      .select('plus, is_active')
      .eq('id', userId)
      .single();
    
    isPlus = userProfile?.plus || false;
    isActive = userProfile?.is_active !== false;
      
    // 非Plus用户的上传数量限制检查
    if (!isPlus || !isActive) {
      const { data: pdfCount } = await supabaseService
        .from('pdfs')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);
        
      const count = pdfCount?.length || 0;
      if (count >= FREE_USER_PDF_LIMIT) {  // 免费用户最多3个PDF
        return NextResponse.json({ 
          error: '免费用户最多上传3个PDF文件，请升级到Plus会员解锁无限上传', 
          code: 'LIMIT_EXCEEDED' 
        }, { status: 403 });
      }
    }

    // 解析FormData
    let formData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error('[Upload API] 解析FormData失败:', error);
      return NextResponse.json({ error: '解析上传数据失败' }, { status: 400 });
    }

    const file = formData.get('file');
    const quality = formData.get('quality') as string;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: '未找到文件或文件格式错误' }, { status: 400 });
    }

    // 获取原始文件名
    const fileName = file instanceof File ? file.name : 'upload.pdf';

    // 检查文件类型
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: '只支持PDF文件' }, { status: 400 });
    }
    
    // 检查文件大小（免费用户限制为10MB，Plus用户无限制）
    const fileSizeMB = Math.round((file.size / 1024 / 1024) * 100) / 100;
    console.log(`[Upload API] 文件大小检查: ${fileName}, 大小: ${file.size} bytes (${fileSizeMB}MB), isPlus: ${isPlus}, isActive: ${isActive}`);
    
    if (!isPlus || !isActive) {
      console.log(`[Upload API] 非Plus用户，检查大小限制: ${file.size} > ${FREE_USER_MAX_FILE_SIZE} = ${file.size > FREE_USER_MAX_FILE_SIZE}`);
      if (file.size > FREE_USER_MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: '免费用户文件大小限制为10MB，请升级到Plus会员解锁无限制上传', 
          code: 'FILE_TOO_LARGE_FREE',
          details: `文件大小: ${fileSizeMB}MB, 限制: 10MB`,
          fileSize: file.size,
          fileSizeMB: fileSizeMB,
          maxSize: FREE_USER_MAX_FILE_SIZE
        }, { status: 400 });
      }
    } else {
      console.log(`[Upload API] Plus用户，无大小限制`);
    }

    console.log(`[Upload API] 处理上传文件: ${fileName}, 大小: ${file.size}, 质量模式: ${quality}`);

    // 使用用户认证的客户端直接上传
    try {
      // 生成唯一文件名
      const timestamp = Date.now();
      const safeUserId = userEmail.split('@')[0];
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const uniqueFileName = `${safeUserId}_${timestamp}.${fileExtension}`;
      
      // 将File/Blob转换为ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      console.log('[Upload API] 使用用户认证客户端上传文件:', uniqueFileName);
      
      // 使用用户认证的客户端上传
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(uniqueFileName, arrayBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });
        
      if (uploadError) {
        console.error('[Upload API] 用户上传失败:', uploadError);
        throw new Error('文件上传失败: ' + uploadError.message);
      }
      
      // 获取文件URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(uniqueFileName);
        
      console.log('[Upload API] 文件已上传，URL:', publicUrl);
      
      // 使用Supabase创建PDF记录
      console.log('[Upload API] 准备创建数据库记录');
      
      const { data: pdf, error: pdfCreateError } = await supabaseService
        .from('pdfs')
        .insert({
          name: fileName,
          url: publicUrl,
          size: file.size,
          user_id: userId,
          summary: fileName
        })
        .select()
        .single();
      
      if (pdfCreateError) {
        console.error('[Upload API] 创建PDF记录失败:', pdfCreateError);
        throw new Error('数据库记录创建失败: ' + pdfCreateError.message);
      }
      
      console.log('[Upload API] 数据库记录创建成功，PDF ID:', pdf.id);
      
      // 后台处理PDF到RAG系统（不阻塞响应）
      processPDFToRAGSystem(pdf.id, fileName, publicUrl, quality).catch(error => {
        console.error('[Upload API] RAG系统处理失败:', error);
      });
      
      return NextResponse.json({
        message: '文件上传成功',
        pdf: pdf,
        url: publicUrl
      });
      
    } catch (directUploadError) {
      console.error('[Upload API] 直接上传失败，尝试使用pdf-service:', directUploadError);
      
      // 如果直接上传失败，回退到使用pdf-service
      const pdf = await uploadPDF(file, userId, fileName);
      console.log('[Upload API] 文件上传成功, ID:', pdf.id);
      
      // 后台处理PDF到RAG系统（不阻塞响应）
      processPDFToRAGSystem(pdf.id, fileName, pdf.url, quality).catch(error => {
        console.error('[Upload API] RAG系统处理失败:', error);
      });
      
      return NextResponse.json({
        message: '文件上传成功',
        pdf: pdf,
        url: pdf.url
      });
    }
  } catch (error) {
    console.error('[Upload API] 上传处理失败:', error);
    
    // 详细错误日志
    if (error instanceof Error) {
      console.error('[Upload API] Error name:', error.name);
      console.error('[Upload API] Error message:', error.message);
      console.error('[Upload API] Error stack:', error.stack);
    }
    
    // 根据错误类型返回适当的错误信息
    const errorMessage = error instanceof Error ? error.message : '上传处理失败';
    
    // 确定状态码
    let statusCode = 500;
    if (errorMessage.includes('未登录')) {
      statusCode = 401;
    } else if (errorMessage.includes('限制') || errorMessage.includes('LIMIT_EXCEEDED')) {
      statusCode = 403;
    } else if (errorMessage.includes('未找到文件') || errorMessage.includes('只支持PDF')) {
      statusCode = 400;
    } else if (errorMessage.includes('PayloadTooLargeError') || errorMessage.includes('413')) {
      statusCode = 413;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: error instanceof Error ? error.name : 'UPLOAD_ERROR',
      details: process.env.NODE_ENV === 'development' ? {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      } : undefined
    }, { status: statusCode });
  }
} 