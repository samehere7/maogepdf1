// 暂时禁用中间件以解决重定向循环问题
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  // 直接通过，不做任何处理
  return NextResponse.next();
}

export const config = {
  matcher: [
    // 只匹配根路径以避免过度处理
    '/',
  ],
}