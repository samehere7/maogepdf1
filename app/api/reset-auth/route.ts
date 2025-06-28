import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    
    // 强制登出
    await supabase.auth.signOut();
    
    const response = NextResponse.json({
      message: '认证状态已重置，请重新登录',
      success: true
    });
    
    // 清除相关cookies
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    return response;
    
  } catch (error) {
    return NextResponse.json({
      error: '重置失败',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: '认证重置端点',
    instructions: '使用POST方法重置认证状态'
  });
}