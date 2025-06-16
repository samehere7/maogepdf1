import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    console.log('[Debug Auth] 开始调试认证状态...')
    
    const supabase = createClient()
    const cookieStore = cookies()
    
    // 检查所有cookies
    console.log('[Debug Auth] 检查cookies...')
    const allCookies = cookieStore.getAll()
    console.log('[Debug Auth] 所有cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`))
    
    // 检查自定义cookies
    const sbAccessToken = cookieStore.get('sb-access-token')
    const sbRefreshToken = cookieStore.get('sb-refresh-token')
    console.log('[Debug Auth] 自定义access token:', !!sbAccessToken)
    console.log('[Debug Auth] 自定义refresh token:', !!sbRefreshToken)
    
    // 尝试获取会话
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[Debug Auth] getSession结果:', {
      hasSession: !!session,
      error: sessionError?.message,
      userId: session?.user?.id
    })
    
    // 尝试获取用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[Debug Auth] getUser结果:', {
      hasUser: !!user,
      error: userError?.message,
      userId: user?.id
    })
    
    return NextResponse.json({
      debug: {
        cookies: allCookies.length,
        customTokens: {
          access: !!sbAccessToken,
          refresh: !!sbRefreshToken
        },
        session: {
          exists: !!session,
          error: sessionError?.message
        },
        user: {
          exists: !!user,
          error: userError?.message,
          id: user?.id
        }
      }
    })
    
  } catch (error) {
    console.error('[Debug Auth] 调试失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}