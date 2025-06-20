import { type CookieOptions, createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';
import {locales} from './i18n';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always'
});

export async function middleware(request: NextRequest) {
  // First handle internationalization
  const intlResponse = intlMiddleware(request);
  if (intlResponse) {
    return intlResponse;
  }
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // 尝试获取会话
  const { data: { session } } = await supabase.auth.getSession()
  
  // 如果没有会话，检查自定义cookies
  let hasValidSession = !!session
  if (!session) {
    const accessToken = request.cookies.get('sb-access-token')?.value
    if (accessToken) {
      console.log(`[Middleware] 找到自定义访问令牌`)
      hasValidSession = true
    }
  }
  
  console.log(`[Middleware] 路径: ${request.nextUrl.pathname}, 会话状态: ${hasValidSession ? '已登录' : '未登录'}`)
  
  const protectedPaths = ['/analysis', '/account']
  const path = request.nextUrl.pathname
  
  const isProtectedPath = protectedPaths.some(prefix => path.startsWith(prefix))
  if (isProtectedPath && !hasValidSession) {
    console.log(`[Middleware] 重定向未授权访问: ${path} -> /auth/login`)
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', path)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(de|en|es|fr|it|ja|ko|pt-BR|ru|zh|zh-TW|nl|sv|da|no|fi|pl|tr|hi|bn|pa|kn|th|vi|id|ms)/:path*',
    
    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)'
  ],
} 