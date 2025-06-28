import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    console.log('[Test Auth] 测试前端认证状态');
    
    // 检查cookies
    const cookieHeader = req.headers.get('cookie');
    console.log('[Test Auth] Cookies present:', !!cookieHeader);
    
    // 检查Authorization header
    const authHeader = req.headers.get('authorization');
    console.log('[Test Auth] Auth header present:', !!authHeader);
    
    // 尝试从服务端获取用户
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[Test Auth] User from server:', user ? user.email : 'null');
    console.log('[Test Auth] Auth error:', authError?.message || 'none');
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookiesPresent: !!cookieHeader,
      authHeaderPresent: !!authHeader,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      authError: authError?.message || null,
      headers: {
        cookie: cookieHeader ? 'present' : 'missing',
        authorization: authHeader ? 'present' : 'missing'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // 用于测试带有Authorization header的请求
  return GET(req);
}