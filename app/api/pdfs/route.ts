import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPDFs } from '@/lib/pdf-service';

export async function GET(request: Request) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user?.id) {
      console.log('[PDFs API] 无法获取用户ID，认证错误:', authError?.message);
      return NextResponse.json({ error: '未登录' }, { status: 401 });
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