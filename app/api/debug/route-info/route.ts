import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const url = new URL(request.url);
    
    // 获取所有重要的请求信息
    const debugInfo = {
      timestamp: new Date().toISOString(),
      url: {
        href: request.url,
        pathname: url.pathname,
        searchParams: Object.fromEntries(url.searchParams),
        origin: url.origin,
        host: url.host,
      },
      headers: {
        'user-agent': headersList.get('user-agent'),
        'accept-language': headersList.get('accept-language'),
        'x-forwarded-for': headersList.get('x-forwarded-for'),
        'x-real-ip': headersList.get('x-real-ip'),
        'x-middleware-rewrite': headersList.get('x-middleware-rewrite'),
        'x-middleware-next-data': headersList.get('x-middleware-next-data'),
        'referer': headersList.get('referer'),
        'host': headersList.get('host'),
        'x-forwarded-host': headersList.get('x-forwarded-host'),
        'x-forwarded-proto': headersList.get('x-forwarded-proto'),
        'cookie': headersList.get('cookie'),
      },
      nextjs: {
        nextLocale: request.cookies.get('NEXT_LOCALE')?.value,
        allCookies: Object.fromEntries(
          request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
        ),
      },
      server: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
        deploymentUrl: process.env.DEPLOYMENT_URL,
      }
    };

    return NextResponse.json(debugInfo, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get debug info',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}