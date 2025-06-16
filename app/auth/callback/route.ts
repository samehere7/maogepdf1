import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectedFrom = searchParams.get('redirectedFrom') || '/'
  
  console.log(`[Auth Callback] 收到回调请求，code: ${!!code}`)
  
  if (!code) {
    console.log('[Auth Callback] 没有授权码，重定向到首页')
    return NextResponse.redirect(`${origin}${redirectedFrom}`)
  }

  try {
    let response = NextResponse.redirect(`${origin}${redirectedFrom}`)
    
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[Auth Callback] 交换会话失败:', error)
      return NextResponse.redirect(`${origin}/error?message=${encodeURIComponent(error.message)}`)
    }

    console.log('[Auth Callback] 会话交换成功，用户ID:', data.session?.user.id)
    
    // 手动设置会话cookies
    if (data.session) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      }
      
      response.cookies.set('sb-access-token', data.session.access_token, cookieOptions)
      response.cookies.set('sb-refresh-token', data.session.refresh_token || '', cookieOptions)
    }

    return response
  } catch (error) {
    console.error('[Auth Callback] 处理回调失败:', error)
    return NextResponse.redirect(`${origin}/error?message=${encodeURIComponent('登录处理失败')}`)
  }
} 