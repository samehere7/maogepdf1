import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // 获取URL参数
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectedFrom = searchParams.get('redirectedFrom') || '/'
  
  console.log(`[Auth Callback] 收到回调请求，重定向目标: ${redirectedFrom}`)
  
  // 如果没有授权码，重定向到错误页面
  if (!code) {
    console.error('[Auth Callback] 没有收到授权码')
    return NextResponse.redirect(`${origin}/error?message=授权失败`)
  }

  try {
    // 创建Supabase客户端并交换授权码获取会话
    const supabase = createClient()
    console.log('[Auth Callback] 开始交换授权码获取会话')
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[Auth Callback] 交换会话失败:', error)
      return NextResponse.redirect(`${origin}/error?message=登录失败`)
    }
    
    console.log('[Auth Callback] 会话交换成功，用户ID:', data.session?.user.id)
    
    // 成功登录后重定向到原始请求页面或首页
    console.log(`[Auth Callback] 重定向到: ${origin}${redirectedFrom}`)
    return NextResponse.redirect(`${origin}${redirectedFrom}`)
  } catch (error) {
    console.error('[Auth Callback] 处理回调时出错:', error)
    return NextResponse.redirect(`${origin}/error?message=处理登录时出错`)
  }
} 