import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const envInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    nextauth_url: process.env.NEXTAUTH_URL,
    vercel_url: process.env.VERCEL_URL,
    nextauth_secret: process.env.NEXTAUTH_SECRET ? '***已设置***' : '未设置',
    google_client_id: process.env.GOOGLE_CLIENT_ID ? '***已设置***' : '未设置',
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET ? '***已设置***' : '未设置',
    request_headers: {
      host: request.headers.get('host'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    },
    expected_nextauth_url: 'https://www.maogepdf.com',
    current_issue: process.env.NEXTAUTH_URL === 'http://localhost:3000' ? '❌ NEXTAUTH_URL 设置错误' : '✅ NEXTAUTH_URL 正确'
  };

  return NextResponse.json(envInfo, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    }
  });
}