import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deletePDF } from '@/lib/pdf-service';

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