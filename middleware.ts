import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 Middleware called for:', pathname);
  
  // 直接处理根路径重定向
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/en';
    console.log('🚨 Root path detected, redirecting to /en');
    return NextResponse.redirect(url, { status: 307 });
  }
  
  // 让其他路径正常处理
  return NextResponse.next();
}

export const config = {
  matcher: [
    // 只匹配根路径，简化处理
    '/'
  ]
}