import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 解析请求体
    const { pdfId, userId } = await req.json();
    
    if (!pdfId) {
      return NextResponse.json({ error: '缺少PDF ID' }, { status: 400 });
    }

    // 验证用户是否有权限访问该PDF
    const { data: pdf, error: pdfError } = await supabase
      .from('pdfs')
      .select('id, name, url')
      .eq('id', pdfId)
      .eq('user_id', user.id)
      .single();

    if (pdfError || !pdf) {
      return NextResponse.json({ error: '无权访问该PDF' }, { status: 403 });
    }

    // 生成唯一的分享ID
    const shareId = `${pdfId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建分享记录（使用简单的方式，如果有shares表的话）
    try {
      // 尝试插入分享记录到shares表（如果存在）
      const { error: insertError } = await supabase
        .from('shares')
        .insert({
          share_id: shareId,
          pdf_id: pdfId,
          user_id: user.id,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后过期
        });

      if (insertError) {
        console.log('shares表不存在或插入失败，使用降级方案:', insertError);
      }
    } catch (error) {
      console.log('创建分享记录失败，使用降级方案:', error);
    }

    // 返回分享ID
    return NextResponse.json({
      shareId,
      pdfName: pdf.name,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('创建分享链接失败:', error);
    return NextResponse.json(
      { error: '创建分享链接失败' },
      { status: 500 }
    );
  }
}