import { supabaseService } from '@/lib/supabase/service-client';
import { createAdminClient } from './supabase/admin';

// 获取用户的PDF列表
export async function getUserPDFs(userId: string) {
  try {
    console.log('[PDF Service] 获取用户PDF列表，用户ID:', userId);
    
    const { data: pdfs, error } = await supabaseService
      .from('pdfs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PDF Service] 查询PDF列表失败:', error);
      throw new Error('查询PDF列表失败: ' + error.message);
    }

    console.log('[PDF Service] 找到PDF数量:', pdfs?.length || 0);
    return pdfs || [];
  } catch (error) {
    console.error('[PDF Service] getUserPDFs 错误:', error);
    throw error;
  }
}

// 获取单个PDF信息
export async function getPDF(pdfId: string, userId: string) {
  try {
    console.log('[PDF Service] 获取PDF详情，ID:', pdfId, '用户:', userId);
    
    const { data: pdf, error } = await supabaseService
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 没有找到记录
        return null;
      }
      console.error('[PDF Service] 查询PDF失败:', error);
      throw new Error('查询PDF失败: ' + error.message);
    }

    console.log('[PDF Service] 成功获取PDF信息:', pdf?.name);
    return pdf;
  } catch (error) {
    console.error('[PDF Service] getPDF 错误:', error);
    throw error;
  }
}

// 删除PDF
export async function deletePDF(pdfId: string, userId: string) {
  try {
    console.log('[PDF Service] 删除PDF，ID:', pdfId, '用户:', userId);
    
    // 首先检查PDF是否存在且属于用户
    const pdf = await getPDF(pdfId, userId);
    if (!pdf) {
      throw new Error('PDF文件未找到或无权限访问');
    }

    // 从数据库删除记录
    const { error: deleteError } = await supabaseService
      .from('pdfs')
      .delete()
      .eq('id', pdfId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('[PDF Service] 删除PDF记录失败:', deleteError);
      throw new Error('删除PDF记录失败: ' + deleteError.message);
    }

    // 尝试从存储删除文件（如果可能的话）
    try {
      const fileName = pdf.url.split('/').pop();
      if (fileName) {
        const adminClient = createAdminClient();
        await adminClient.storage
          .from('pdfs')
          .remove([fileName]);
      }
    } catch (storageError) {
      console.warn('[PDF Service] 删除存储文件失败（但继续），错误:', storageError);
    }

    console.log('[PDF Service] PDF删除成功');
    return true;
  } catch (error) {
    console.error('[PDF Service] deletePDF 错误:', error);
    throw error;
  }
}

// 更新PDF信息
export async function updatePDF(pdfId: string, userId: string, updates: { name?: string }) {
  try {
    console.log('[PDF Service] 更新PDF，ID:', pdfId, '用户:', userId, '更新:', updates);
    
    // 首先检查PDF是否存在且属于用户
    const pdf = await getPDF(pdfId, userId);
    if (!pdf) {
      throw new Error('PDF文件未找到或无权限访问');
    }

    // 更新PDF信息
    const { data: updatedPdf, error } = await supabaseService
      .from('pdfs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', pdfId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[PDF Service] 更新PDF失败:', error);
      throw new Error('更新PDF失败: ' + error.message);
    }

    console.log('[PDF Service] PDF更新成功');
    return updatedPdf;
  } catch (error) {
    console.error('[PDF Service] updatePDF 错误:', error);
    throw error;
  }
}

// 创建PDF记录（用于上传API）
export async function createPDF(data: {
  name: string;
  url: string;
  size: number;
  user_id: string;
  summary?: string;
}) {
  try {
    console.log('[PDF Service] 创建PDF记录:', data.name);
    
    const { data: pdf, error } = await supabaseService
      .from('pdfs')
      .insert({
        ...data,
        summary: data.summary || data.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[PDF Service] 创建PDF记录失败:', error);
      throw new Error('创建PDF记录失败: ' + error.message);
    }

    console.log('[PDF Service] PDF记录创建成功，ID:', pdf.id);
    return pdf;
  } catch (error) {
    console.error('[PDF Service] createPDF 错误:', error);
    throw error;
  }
}

// 上传PDF文件（简化版本）
export async function uploadPDF(file: File | Blob, userId: string, fileName?: string) {
  try {
    const actualFileName = fileName || (file instanceof File ? file.name : 'upload.pdf');
    const fileSize = file instanceof File ? file.size : file.size;
    
    console.log(`[PDF Service] 开始处理PDF上传: ${actualFileName}, 大小: ${fileSize}字节, 用户ID: ${userId}`);
    
    // 创建管理员客户端
    const adminClient = createAdminClient();
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const userPrefix = userId.substring(0, 8);
    const fileExtension = actualFileName.split('.').pop()?.toLowerCase();
    const uniqueFileName = `${userPrefix}_${timestamp}.${fileExtension}`;
    
    // 将File/Blob转换为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    console.log(`[PDF Service] 准备上传文件: ${uniqueFileName}, 大小: ${arrayBuffer.byteLength}字节`);
    
    // 上传文件
    const { data, error } = await adminClient.storage
      .from('pdfs')
      .upload(uniqueFileName, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (error) {
      console.error('[PDF Service] 上传文件失败:', error);
      throw new Error('文件上传失败: ' + error.message);
    }
    
    // 获取文件URL
    const { data: { publicUrl } } = adminClient.storage
      .from('pdfs')
      .getPublicUrl(uniqueFileName);
      
    if (!publicUrl) {
      throw new Error('无法获取文件公共URL');
    }
    
    console.log('[PDF Service] 文件上传成功，URL:', publicUrl);

    // 创建数据库记录
    const pdf = await createPDF({
      name: actualFileName,
      url: publicUrl,
      size: fileSize,
      user_id: userId,
      summary: `📄 ${actualFileName.replace(/\.(pdf|PDF)$/, '')}`
    });
    
    console.log(`[PDF Service] 数据库记录已创建, ID: ${pdf.id}`);
    return pdf;
    
  } catch (error) {
    console.error('[PDF Service] PDF上传过程中出错:', error);
    throw error;
  }
}