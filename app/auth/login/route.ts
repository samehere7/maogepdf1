import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  console.log('[Auth Login Route] 处理登录请求')
  
  try {
  const supabase = createClient()
    
    // 检查是否已登录
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      console.log('[Auth Login Route] 用户已登录，重定向到首页')
      return NextResponse.redirect(origin)
    }
    
    console.log('[Auth Login Route] 开始Google OAuth登录流程')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
      console.error('[Auth Login Route] OAuth初始化失败:', error)
      return NextResponse.redirect(`${origin}/error?message=${encodeURIComponent('登录初始化失败')}`)
  }

  if (data.url) {
      console.log('[Auth Login Route] 重定向到OAuth提供商:', data.url)
    return NextResponse.redirect(data.url)
  }

    console.error('[Auth Login Route] 没有收到重定向URL')
    return NextResponse.redirect(`${origin}/error?message=${encodeURIComponent('登录流程异常')}`)
  } catch (error) {
    console.error('[Auth Login Route] 处理登录请求时出错:', error)
    return NextResponse.redirect(`${origin}/error?message=${encodeURIComponent('登录处理失败')}`)
  }
} 