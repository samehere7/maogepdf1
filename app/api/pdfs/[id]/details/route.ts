import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPDF } from '@/lib/pdf-service';

// 获取单个PDF详情
export async function GET(
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
    
    if (!pdfId) {
      return NextResponse.json({ error: '缺少PDF ID' }, { status: 400 });
    }

    console.log('[PDF Details API] 获取PDF详情，ID:', pdfId, '用户:', user.id);

    // 从数据库获取PDF信息
    const pdf = await getPDF(pdfId, user.id);
    
    if (!pdf) {
      console.log('[PDF Details API] 未找到PDF或无权限访问');
      return NextResponse.json({ error: 'PDF文件未找到或无权限访问' }, { status: 404 });
    }

    console.log('[PDF Details API] 成功获取PDF信息:', pdf.name);

    return NextResponse.json({ 
      pdf 
    });

  } catch (error) {
    console.error('[PDF Details API] 获取PDF详情失败:', error);
    return NextResponse.json({ 
      error: '获取PDF详情失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}