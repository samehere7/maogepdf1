import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // 支持的语言列表
  locales: ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt-BR', 'ru', 'it', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'tr', 'hi', 'bn', 'pa', 'kn', 'th', 'vi', 'id', 'ms'],
  
  // 默认语言
  defaultLocale: 'en',
  
  // 始终显示locale前缀
  localePrefix: 'always',
  
  // 路径名本地化（如果需要的话）
  pathnames: {
    '/': '/',
    '/analysis/[id]': '/analysis/[id]',
    '/account': '/account',
    '/auth/login': '/auth/login',
    '/auth/callback': '/auth/callback',
    '/about': '/about',
    '/contact': '/contact',
    '/privacy': '/privacy',
    '/privacy-policy': '/privacy-policy',
    '/terms': '/terms',
    '/terms-of-use': '/terms-of-use',
    '/refund': '/refund',
    '/debug': '/debug',
    '/ultimate-debug': '/ultimate-debug'
  }
});

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 处理Supabase认证
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // 刷新session
  await supabase.auth.getUser();

  // 处理国际化
  return intlMiddleware(request);
}

export const config = {
  // 匹配所有路径，除了API路由、静态文件等
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
};