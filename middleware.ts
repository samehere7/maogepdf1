import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: false, // 禁用自动语言检测，避免重定向循环
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/'
  }
});

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 特殊处理：如果是根路径访问，强制清除可能冲突的locale cookie
  if (pathname === '/') {
    console.log('Root path access detected, clearing locale cookie conflicts');
    
    // 创建一个新的请求，不带有可能冲突的cookie
    const response = intlMiddleware(request);
    
    // 确保根路径使用默认语言
    if (response) {
      response.cookies.set('NEXT_LOCALE', defaultLocale, {
        path: '/',
        sameSite: 'lax'
      });
    }
    
    return response;
  }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
}