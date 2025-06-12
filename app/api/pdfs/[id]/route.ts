import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deletePDF, updatePDF } from '@/lib/pdf-service';

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

    // 删除PDF
    await deletePDF(pdfId, user.id);
    
    console.log('[Delete PDF API] PDF删除成功');

    return NextResponse.json({ 
      message: 'PDF删除成功' 
    });

  } catch (error) {
    console.error('[Delete PDF API] 删除PDF失败:', error);
    return NextResponse.json({ 
      error: '删除PDF失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}