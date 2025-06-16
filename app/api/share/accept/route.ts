import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { shareId } = await req.json();
    
    if (!shareId) {
      return NextResponse.json({ error: '缺少分享ID' }, { status: 400 });
    }

    console.log('处理分享接收，shareId:', shareId);

    // 获取当前用户
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: '用户未登录' }, { status: 401 });
    }

    // 解析shareId获取原PDF信息
    const parts = shareId.split('-');
    const originalPdfId = parts[0];
    
    if (!originalPdfId || parts.length < 2) {
      return NextResponse.json({ error: '无效的分享链接格式' }, { status: 400 });
    }

    // 通过API获取原PDF信息
    const pdfResponse = await fetch(`${req.nextUrl.origin}/api/share/pdf/${originalPdfId}`);
    
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'PDF文件不存在或已被删除' }, { status: 404 });
    }
    
    const pdfData = await pdfResponse.json();
    const originalPdf = pdfData.pdf;
    
    if (!originalPdf) {
      return NextResponse.json({ error: '获取PDF信息失败' }, { status: 404 });
    }

    // 检查用户是否已经有这个PDF的副本
    const { data: existingPdf, error: checkError } = await supabase
      .from('pdfs')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', originalPdf.name)
      .eq('url', originalPdf.url)
      .single();
    
    if (existingPdf) {
      // 已经有副本了，直接返回现有的PDF ID
      return NextResponse.json({
        success: true,
        message: '您已经拥有此PDF的副本',
        pdfId: existingPdf.id,
        action: 'existing'
      });
    }

    // 创建PDF副本到用户账户
    const { data: newPdf, error: createError } = await supabase
      .from('pdfs')
      .insert({
        name: `${originalPdf.name} (来自分享)`,
        url: originalPdf.url,
        size: originalPdf.size,
        user_id: user.id,
        content_type: 'application/pdf',
        summary: `通过分享链接从 ${originalPdf.ownerName} 获得的PDF副本`
      })
      .select()
      .single();

    if (createError || !newPdf) {
      console.error('创建PDF副本失败:', createError);
      return NextResponse.json({ error: '创建PDF副本失败' }, { status: 500 });
    }

    console.log('成功创建PDF副本:', newPdf.id);

    return NextResponse.json({
      success: true,
      message: `成功接收来自 ${originalPdf.ownerName} 的PDF分享`,
      pdfId: newPdf.id,
      pdfName: newPdf.name,
      action: 'created'
    });

  } catch (error) {
    console.error('处理分享接收错误:', error);
    return NextResponse.json({ 
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}