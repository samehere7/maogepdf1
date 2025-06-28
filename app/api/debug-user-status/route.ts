import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseService } from '@/lib/supabase/service-client';

export async function GET(req: Request) {
  try {
    // 方案1: 尝试从服务端cookie获取用户认证
    let user = null;
    let authMethod = '';
    
    try {
      const supabase = createClient();
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
      if (cookieUser && !cookieError) {
        user = cookieUser;
        authMethod = 'cookie';
      }
    } catch (cookieError) {
      console.log('[Debug] Cookie认证失败:', cookieError);
    }
    
    // 方案2: 如果cookie认证失败，尝试从Authorization header获取token
    if (!user) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { createClient: createAuthClient } = await import('@supabase/supabase-js');
          const authClient = createAuthClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          const { data: { user: tokenUser }, error: tokenError } = await authClient.auth.getUser(token);
          if (tokenUser && !tokenError) {
            user = tokenUser;
            authMethod = 'token';
          }
        } catch (tokenError) {
          console.log('[Debug] Token认证失败:', tokenError);
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        authMethod: 'none',
        message: '用户未登录'
      });
    }

    // 获取用户Plus状态
    const { data: userProfile } = await supabaseService
      .from('user_profiles')
      .select('plus, is_active')
      .eq('id', user.id)
      .single();
    
    const isPlus = userProfile?.plus || false;
    const isActive = userProfile?.is_active !== false;
    
    return NextResponse.json({
      authenticated: true,
      authMethod,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: userProfile,
      status: {
        isPlus,
        isActive,
        canUploadLargeFiles: isPlus && isActive,
        maxFileSize: isPlus && isActive ? 'unlimited' : '10MB'
      },
      limits: {
        FREE_USER_MAX_FILE_SIZE: 10 * 1024 * 1024,
        FREE_USER_PDF_LIMIT: 3
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}