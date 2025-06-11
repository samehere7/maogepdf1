import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 创建Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 检查必要的环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少Supabase配置环境变量');
  throw new Error('Supabase配置错误');
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// 上传文件到Supabase存储
export async function uploadFileToStorage(file: File | Blob, userId: string, fileName?: string): Promise<string | null> {
  try {
    console.log('开始上传文件到Supabase存储:', {
      fileType: file instanceof File ? 'File' : 'Blob',
      size: file.size,
      fileName: fileName,
      userId: userId
    });
    
    // 检查文件大小
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      throw new Error(`文件大小超过限制：${file.size} > ${MAX_SIZE} bytes`);
    }
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const actualFileName = fileName || (file instanceof File ? file.name : 'upload.pdf');
    const fileExtension = actualFileName.split('.').pop()?.toLowerCase();
    
    // 检查文件类型
    if (fileExtension !== 'pdf') {
      throw new Error('只支持PDF文件格式');
    }
    
    // 使用userId和时间戳创建唯一文件名，但不包含完整邮箱（避免隐私问题）
    const safeUserId = userId.split('@')[0]; // 只取邮箱@前面的部分
    const uniqueFileName = `${safeUserId}_${timestamp}.${fileExtension}`;
    
    // 不要包含pdfs/前缀，因为from('pdfs')已经指定了桶
    const filePath = uniqueFileName;
    
    let uploadBlob: Blob;
    let contentType = 'application/pdf';
    
    if (file instanceof File) {
      // 如果是File对象，直接使用
      uploadBlob = file;
      contentType = file.type || 'application/pdf';
    } else {
      // 如果是Blob，确保设置正确的content-type
      uploadBlob = new Blob([file], { type: 'application/pdf' });
    }
    
    console.log('准备上传文件:', {
      filePath,
      contentType,
      size: uploadBlob.size,
      bucket: 'pdfs'
    });

    // 上传文件
    const { data, error } = await supabase.storage
      .from('pdfs')
      .upload(filePath, uploadBlob, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Supabase存储上传错误:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
        path: filePath,
        size: uploadBlob.size
      });
      
      // 特殊处理RLS错误
      if (error.message && error.message.includes('row-level security policy')) {
        throw new Error('存储权限错误: 请联系管理员检查存储桶RLS策略设置');
      }
      
      throw error;
    }

    console.log('文件上传成功:', data);

    // 获取文件的公共URL
    const { data: { publicUrl } } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      throw new Error('无法获取文件公共URL');
    }

    console.log('获取到文件公共URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('文件上传过程中出错:', error);
    if (error instanceof Error) {
      console.error('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return null;
  }
}

// 从Supabase存储中删除文件
export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error } = await supabase.storage
      .from('pdfs')
      .remove([filePath]);
      
    if (error) {
      console.error('Supabase存储删除错误:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('文件删除过程中出错:', error);
    return false;
  }
} 