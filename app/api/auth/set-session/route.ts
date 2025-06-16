import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token, expires_at } = await request.json()
    
    if (!access_token) {
      return NextResponse.json({ error: '缺少access_token' }, { status: 400 })
    }

    console.log('[Set Session API] 设置服务端session')
    
    const supabase = createClient()
    
    // 使用access_token设置session
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    })
    
    if (error) {
      console.error('[Set Session API] 设置session失败:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    console.log('[Set Session API] Session设置成功，用户ID:', data.session?.user.id)
    
    // 创建响应并设置cookies
    const response = NextResponse.json({ success: true })
    
    // 设置认证cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    }
    
    response.cookies.set('sb-access-token', access_token, cookieOptions)
    if (refresh_token) {
      response.cookies.set('sb-refresh-token', refresh_token, cookieOptions)
    }
    
    return response
    
  } catch (error) {
    console.error('[Set Session API] 处理失败:', error)
    return NextResponse.json({ error: '处理失败' }, { status: 500 })
  }
}