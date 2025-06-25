import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deletePDF, updatePDF } from '@/lib/pdf-service-supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const pdfId = params.id;
    const { name } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: '文件名不能为空' }, { status: 400 });
    }

    console.log('[Update PDF API] 更新PDF名称，ID:', pdfId, '新名称:', name, '用户:', user.id);

    // 更新PDF名称
    await updatePDF(pdfId, user.id, { name: name.trim() });
    
    console.log('[Update PDF API] PDF更新成功');

    return NextResponse.json({ 
      message: 'PDF更新成功' 
    });

  } catch (error) {
    console.error('[Update PDF API] 更新PDF失败:', error);
    return NextResponse.json({ 
      error: '更新PDF失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const pdfId = params.id;
    console.log('[Delete PDF API] 删除PDF，ID:', pdfId, '用户:', user.id);

    // 在删除前获取用户的所有PDF列表，用于确定下一个PDF
    const { data: allPdfs } = await supabase
      .from('pdfs')
      .select('id, upload_date')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false });
    
    // 找到当前PDF在列表中的位置
    const currentIndex = allPdfs?.findIndex(pdf => pdf.id === pdfId) ?? -1;
    let nextPdfId = null;
    
    if (allPdfs && allPdfs.length > 1) {
      // 如果有多个PDF，选择下一个
      if (currentIndex >= 0 && currentIndex < allPdfs.length - 1) {
        // 如果不是最后一个，选择下一个
        nextPdfId = allPdfs[currentIndex + 1].id;
      } else if (currentIndex > 0) {
        // 如果是最后一个，选择上一个
        nextPdfId = allPdfs[currentIndex - 1].id;
      }
    }

    // 删除PDF
    await deletePDF(pdfId, user.id);
    
    console.log('[Delete PDF API] PDF删除成功，下一个PDF ID:', nextPdfId);

    return NextResponse.json({ 
      message: 'PDF删除成功',
      nextPdfId: nextPdfId
    });

  } catch (error) {
    console.error('[Delete PDF API] 删除PDF失败:', error);
    return NextResponse.json({ 
      error: '删除PDF失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}