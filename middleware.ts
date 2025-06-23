// 完全禁用中间件
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
}