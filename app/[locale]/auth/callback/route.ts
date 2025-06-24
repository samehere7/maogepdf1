import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectedFrom = searchParams.get('redirectedFrom') || '/'
  
  console.log('Auth callback received:', { code: !!code, redirectedFrom, origin })

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('认证错误:', error)
        return NextResponse.redirect(`${origin}/en/auth/login?error=auth_error`)
      }
      
      console.log('认证成功:', { user: data.user?.email })
      
      // 获取locale从路径或默认使用en
      const pathSegments = new URL(request.url).pathname.split('/')
      const locale = pathSegments[1] || 'en'
      
      // 重定向到原始页面或首页
      const finalRedirect = redirectedFrom.startsWith('/') 
        ? `${origin}/${locale}${redirectedFrom}`
        : `${origin}/${locale}`
        
      console.log('重定向到:', finalRedirect)
      
      return NextResponse.redirect(finalRedirect)
    } catch (error) {
      console.error('代码交换失败:', error)
      return NextResponse.redirect(`${origin}/en/auth/login?error=exchange_error`)
    }
  }

  // 没有代码，重定向到登录页面
  console.log('没有认证代码，重定向到登录')
  return NextResponse.redirect(`${origin}/en/auth/login?error=no_code`)
}