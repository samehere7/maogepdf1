import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    // 检查用户是否已登录
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { pdfId } = await req.json();
    
    if (!pdfId) {
      return NextResponse.json({ error: '未提供PDF ID' }, { status: 400 });
    }

    // 删除该PDF的所有聊天记录
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('document_id', pdfId)
      .eq('user_id', user.id);

    if (error) {
      console.error('删除聊天记录失败:', error);
      return NextResponse.json({ error: '删除聊天记录失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('重置聊天记录错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}