import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPDFs } from '@/lib/pdf-service';

export async function GET(request: Request) {
  try {
    // 使用更可靠的认证方式
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[PDFs API] 缺少认证头');
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 使用普通客户端验证 token
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user?.id) {
      console.log('[PDFs API] 认证失败:', authError?.message);
      return NextResponse.json({ error: '认证失败' }, { status: 401 });
    }
    
    const userId = user.id;
    console.log('[PDFs API] 获取用户PDF列表，用户ID:', userId);

    // 从数据库获取用户的PDF列表
    const pdfs = await getUserPDFs(userId);
    
    console.log('[PDFs API] 找到PDF数量:', pdfs.length);

    return NextResponse.json({ 
      pdfs: pdfs 
    });

  } catch (error) {
    console.error('[PDFs API] 获取PDF列表失败:', error);
    return NextResponse.json({ 
      error: '获取PDF列表失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}