import { prisma } from './prisma';
import { uploadFileToStorage, deleteFileFromStorage } from './supabase';
import { createAdminClient } from './supabase/admin';

// 上传PDF文件
export async function uploadPDF(file: File | Blob, userId: string, fileName?: string) {
  try {
    const actualFileName = fileName || (file instanceof File ? file.name : 'upload.pdf');
    const fileSize = file instanceof File ? file.size : file.size;
    
    console.log(`开始处理PDF上传: ${actualFileName}, 大小: ${fileSize}字节, 用户ID: ${userId}`);
    
    // 1. 使用管理员客户端直接上传文件到Supabase存储
    console.log('正在使用管理员客户端上传文件...');
    
    // 创建管理员客户端
    const adminClient = createAdminClient();
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    // 使用userId的前8位作为文件名前缀
    const userPrefix = userId.substring(0, 8);
    const fileExtension = actualFileName.split('.').pop()?.toLowerCase();
    const uniqueFileName = `${userPrefix}_${timestamp}.${fileExtension}`;
    
    // 将File/Blob转换为ArrayBuffer
    let arrayBuffer;
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      // 如果已经是Blob，直接转换
      arrayBuffer = await file.arrayBuffer();
    }
    
    console.log(`准备上传文件: ${uniqueFileName}, 大小: ${arrayBuffer.byteLength}字节`);
    
    // 尝试上传，最多重试2次
    let fileUrl = null;
    let lastError = null;
    let attempts = 0;
    const maxAttempts = 3;
    const retryDelay = 1000; // 1秒
    
    while (!fileUrl && attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`上传尝试 ${attempts}/${maxAttempts}...`);
        
        // 使用管理员客户端上传
        const { data, error } = await adminClient.storage
          .from('pdfs')
          .upload(uniqueFileName, arrayBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
          
        if (error) {
          console.error(`第 ${attempts} 次上传尝试失败:`, error);
          lastError = error;
          
          if (attempts < maxAttempts) {
            console.log(`等待 ${retryDelay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
          continue;
        }
        
        // 获取文件URL
        const { data: { publicUrl } } = adminClient.storage
          .from('pdfs')
          .getPublicUrl(uniqueFileName);
          
        if (!publicUrl) {
          throw new Error('无法获取文件公共URL');
        }
        
        fileUrl = publicUrl;
        console.log('上传成功，获取到URL:', fileUrl);
        break;
      } catch (error) {
        lastError = error;
        console.error(`第 ${attempts} 次上传尝试失败:`, error);
        
        if (attempts < maxAttempts) {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    if (!fileUrl) {
      console.error(`Supabase存储上传失败，已尝试${maxAttempts}次`, lastError);
      throw new Error('文件存储服务上传失败，请稍后再试');
    }
    
    console.log(`文件已上传到: ${fileUrl}`);

    // 2. 在数据库中创建PDF记录
    console.log('正在创建数据库记录...');
    
    // 首先检查用户是否存在 - 使用user_profiles表
    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: userId }
    });
    
    if (!userProfile) {
      console.log(`用户ID ${userId} 不存在于user_profiles表，尝试创建用户记录...`);
      
      // 尝试从Supabase获取用户信息
      const adminClient = createAdminClient();
      const { data: authUser, error } = await adminClient.auth.admin.getUserById(userId);
      
      if (error || !authUser?.user) {
        console.error('无法获取用户信息:', error);
        throw new Error(`无法获取用户信息: ${userId}`);
      }
      
      // 创建用户记录 - 使用user_profiles表
      await prisma.user_profiles.create({
        data: {
          id: userId,
          email: authUser.user.email || `user-${userId}@example.com`,
          name: authUser.user.user_metadata?.name || `User-${userId.substring(0, 6)}`
        }
      });
      
      console.log(`已创建用户记录到user_profiles表: ${userId}`);
    }
    
    // 使用用户ID创建PDF记录  
    const pdf = await prisma.pdfs.create({
      data: {
        name: actualFileName,
        url: fileUrl,
        size: fileSize,
        user_id: userId,
        summary: `📄 ${actualFileName.replace(/\.(pdf|PDF)$/, '')}`,
      } as any  // 临时解决类型问题
    });
    
    console.log(`数据库记录已创建, ID: ${pdf.id}`);

    return pdf;
  } catch (error) {
    console.error('PDF上传过程中出错:', error);
    // 如果是Prisma错误，提供更明确的错误信息
    if (error instanceof Error) {
      if (error.message.includes('prisma')) {
        throw new Error('数据库操作失败: ' + error.message);
      } else if (error.message.includes('文件存储服务上传失败')) {
        throw error; // 直接传递上传错误
      }
    }
    throw new Error('PDF上传失败，请重试');
  }
}

// 获取用户的所有PDF
export async function getUserPDFs(userId: string) {
  try {
    const pdfs = await prisma.pdfs.findMany({
      where: {
        user_id: userId
      },
      orderBy: {
        last_viewed: 'desc'
      }
    });
    return pdfs;
  } catch (error) {
    console.error('获取用户PDF列表出错:', error);
    throw error;
  }
}

// 获取单个PDF（带重试机制）
export async function getPDF(pdfId: string, userId: string) {
  let attempts = 0;
  const maxAttempts = 3;
  const retryDelay = 500; // 500ms
  
  while (attempts < maxAttempts) {
    try {
      console.log(`获取PDF尝试 ${attempts + 1}/${maxAttempts}，ID: ${pdfId}, 用户: ${userId}`);
      
      const pdf = await prisma.pdfs.findFirst({
        where: {
          id: pdfId,
          user_id: userId
        }
      });
      
      if (pdf) {
        console.log('PDF找到，正在更新最后查看时间');
        // 更新最后查看时间
        await prisma.pdfs.update({
          where: { id: pdfId },
          data: { last_viewed: new Date() }
        });
        
        return pdf;
      } else {
        console.log(`PDF未找到，尝试 ${attempts + 1}/${maxAttempts}`);
        attempts++;
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch (error) {
      console.error(`获取PDF出错 (尝试 ${attempts + 1}):`, error);
      attempts++;
      
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw error;
      }
    }
  }
  
  console.log('所有尝试均失败，PDF未找到');
  return null;
}

// 删除PDF
export async function deletePDF(pdfId: string, userId: string) {
  try {
    // 1. 获取PDF信息
    const pdf = await prisma.pdfs.findFirst({
      where: {
        id: pdfId,
        user_id: userId
      }
    });

    if (!pdf) {
      throw new Error('PDF不存在或无权限删除');
    }

    // 2. 从URL中提取文件路径
    const filePath = pdf.url.split('/').slice(-2).join('/');
    
    // 3. 从存储中删除文件
    await deleteFileFromStorage(filePath);
    
    // 4. 从数据库中删除记录
    await prisma.pdfs.delete({
      where: {
        id: pdfId
      }
    });

    return true;
  } catch (error) {
    console.error('删除PDF出错:', error);
    throw error;
  }
}

// 更新PDF信息
export async function updatePDF(pdfId: string, userId: string, updates: { name?: string }) {
  try {
    // 1. 检查PDF是否存在且用户有权限
    const pdf = await prisma.pdfs.findFirst({
      where: {
        id: pdfId,
        user_id: userId
      }
    });

    if (!pdf) {
      throw new Error('PDF不存在或无权限编辑');
    }

    // 2. 更新PDF信息
    const updatedPdf = await prisma.pdfs.update({
      where: {
        id: pdfId
      },
      data: updates
    });

    return updatedPdf;
  } catch (error) {
    console.error('更新PDF出错:', error);
    throw error;
  }
}

// 更新PDF的embeddings路径 - 现在PDF表支持embeddings
export async function updatePDFEmbeddings(pdfId: string, embeddingsPath: string, userId: string) {
  try {
    // 如果需要embeddings功能，可以在PDF表中添加embeddings字段
    console.log('embeddings功能待开发：需要在PDF表中添加embeddings字段');
    throw new Error('embeddings功能待开发');
  } catch (error) {
    console.error('更新PDF embeddings出错:', error);
    throw error;
  }
} 