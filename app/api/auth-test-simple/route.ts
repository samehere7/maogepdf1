import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log('\n=== 认证测试开始 ===');
  
  // 1. 检查所有cookies
  const cookies = request.cookies.getAll();
  console.log('1. 所有Cookies数量:', cookies.length);
  cookies.forEach(cookie => {
    if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
      console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    }
  });
  
  // 2. 检查Authorization header
  const authHeader = request.headers.get('authorization');
  console.log('2. Authorization Header:', authHeader ? 'Present' : 'Missing');
  
  // 3. 尝试创建Supabase客户端
  try {
    const supabase = createClient();
    console.log('3. Supabase客户端创建: 成功');
    
    // 4. 尝试获取用户
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('4. 获取用户结果:');
    console.log('   - User:', user ? `${user.email} (${user.id})` : 'null');
    console.log('   - Error:', error ? error.message : 'none');
    
    return NextResponse.json({
      success: true,
      cookiesCount: cookies.length,
      hasAuthHeader: !!authHeader,
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      error: error?.message || null,
      supabaseCookies: cookies.filter(c => 
        c.name.includes('supabase') || c.name.includes('sb-')
      ).map(c => ({
        name: c.name,
        valueLength: c.value.length
      }))
    });
    
  } catch (clientError) {
    console.log('3. Supabase客户端创建: 失败');
    console.log('   - Error:', clientError);
    
    return NextResponse.json({
      success: false,
      error: clientError instanceof Error ? clientError.message : 'Unknown error',
      cookiesCount: cookies.length,
      hasAuthHeader: !!authHeader
    });
  }
}