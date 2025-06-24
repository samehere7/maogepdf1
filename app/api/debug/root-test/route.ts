import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 测试根路径的各种情况
    const tests = [];
    
    // 测试1: 直接访问根路径
    try {
      const response = await fetch(new URL('/', request.url), {
        redirect: 'manual' // 不跟随重定向
      });
      tests.push({
        test: 'Direct root access',
        url: '/',
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        redirected: response.redirected,
      });
    } catch (error) {
      tests.push({
        test: 'Direct root access',
        url: '/',
        error: error.message,
      });
    }

    // 测试2: 测试中文路径
    try {
      const response = await fetch(new URL('/zh', request.url), {
        redirect: 'manual'
      });
      tests.push({
        test: 'Chinese path access',
        url: '/zh',
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        redirected: response.redirected,
      });
    } catch (error) {
      tests.push({
        test: 'Chinese path access',
        url: '/zh',
        error: error.message,
      });
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      server_tests: tests,
      request_info: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Root test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}