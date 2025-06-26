import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadPDF } from '@/lib/pdf-service-supabase';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';
import { supabaseService } from '@/lib/supabase/service-client';

// 免费用户限制配置
const FREE_USER_PDF_LIMIT = 3; // PDF总数限制
const FREE_USER_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB文件大小限制


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
    // 检查用户是否已登录
    const supabase = createClient();
    
    // 获取用户信息
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[Upload API] 用户检查:', user ? `用户 ${user.id}` : '未找到用户', authError ? authError.message : '');
    
    if (!user?.id || !user?.email) {
      console.log('[Upload API] 用户未登录或认证失败，拒绝上传');
      return NextResponse.json({ 
        error: '未登录或认证失败',
        details: authError?.message || 'User not found'
      }, { status: 401 });
    }
    
    const userId = user.id;
    const userEmail = user.email;
    console.log('[Upload API] 用户已登录:', userEmail, '用户ID:', userId);

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

    // 检查用户Plus状态 - 先尝试使用user_with_plus视图
    let isPlus = false;
    let isActive = true;
    
    try {
      // 尝试从user_with_plus视图获取数据
      const { data: userData } = await supabase
        .from('user_with_plus')
        .select('plus, is_active')
        .eq('id', userId)
        .single();
        
      isPlus = userData?.plus || false;
      isActive = userData?.is_active !== false;
    } catch (viewError) {
      console.log('[Upload API] user_with_plus视图不可用，直接从User表获取数据');
      
      // 如果视图不可用，直接从user_profiles表获取
      const { data: userProfile } = await supabaseService
        .from('user_profiles')
        .select('plus, is_active')
        .eq('id', userId)
        .single();
      
      isPlus = userProfile?.plus || false;
      isActive = userProfile?.is_active !== false;
    }
      
    // 非Plus用户的上传数量限制检查
    if (!isPlus || !isActive) {
      const { data: pdfCount } = await supabase
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
    if (!isPlus || !isActive) {
      if (file.size > FREE_USER_MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: '免费用户文件大小限制为10MB，请升级到Plus会员解锁无限制上传', 
          code: 'FILE_TOO_LARGE_FREE' 
        }, { status: 400 });
      }
    }
    // Plus用户无文件大小限制

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
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: error instanceof Error ? error.name : 'UPLOAD_ERROR'
    }, { status: statusCode });
  }
} 