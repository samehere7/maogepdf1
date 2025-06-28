import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Quick auth test endpoint',
    instructions: [
      '1. 请在浏览器Console中运行以下JavaScript代码：',
      '2. 然后将结果告诉我'
    ],
    testCode: `
// 复制并粘贴到浏览器Console中运行：
(async function testAuth() {
  try {
    // 检查是否有Supabase客户端
    if (typeof window === 'undefined' || !window.supabase) {
      console.log('❌ 需要在主页面Console中运行，不是API页面');
      return;
    }
    
    const { data: { session } } = await window.supabase.auth.getSession();
    const { data: { user } } = await window.supabase.auth.getUser();
    
    console.log('🔍 认证状态检查：');
    console.log('User:', user);
    console.log('Session:', session);
    console.log('Access Token Present:', !!session?.access_token);
    
    // 测试API调用
    const headers = {};
    if (session?.access_token) {
      headers['Authorization'] = 'Bearer ' + session.access_token;
    }
    
    const response = await fetch('/api/debug-user-status', {
      headers
    });
    const result = await response.json();
    
    console.log('🔍 API测试结果：');
    console.log('Status:', response.status);
    console.log('Result:', result);
    
    return {
      userLoggedIn: !!user,
      hasAccessToken: !!session?.access_token,
      apiResult: result
    };
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return { error: error.message };
  }
})().then(result => console.log('✅ 最终结果:', result));
    `
  });
}

export async function POST(req: Request) {
  // 测试带Authorization header的请求
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({
      message: '没有Authorization header',
      hasAuth: false
    });
  }
  
  // 尝试验证token
  try {
    const token = authHeader.replace('Bearer ', '');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    return NextResponse.json({
      message: '收到Authorization header',
      hasAuth: true,
      tokenValid: !!user && !error,
      user: user ? { id: user.id, email: user.email } : null,
      error: error?.message || null
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Token验证失败',
      hasAuth: true,
      tokenValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}