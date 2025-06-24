import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    supabase_config: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '***已设置***' : '未设置',
      service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***已设置***' : '未设置',
    },
    google_config: {
      client_id: process.env.GOOGLE_CLIENT_ID ? '***已设置***' : '未设置',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ? '***已设置***' : '未设置',
    },
    nextauth_config: {
      url: process.env.NEXTAUTH_URL || '未设置',
      secret: process.env.NEXTAUTH_SECRET ? '***已设置***' : '未设置',
    },
    request_info: {
      host: request.headers.get('host'),
      protocol: request.headers.get('x-forwarded-proto') || 'http',
      full_url: `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`,
    },
    expected_callback_urls: [
      'https://www.maogepdf.com/en/auth/callback',
      'https://www.maogepdf.com/zh/auth/callback',
    ],
    likely_issues: [
      process.env.NEXT_PUBLIC_SUPABASE_URL ? null : '❌ NEXT_PUBLIC_SUPABASE_URL 未设置',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? null : '❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未设置',
      '❌ Supabase 项目中 Site URL 可能仍设置为 http://localhost:3000',
      '❌ Google OAuth 重定向 URI 可能未包含生产域名',
    ].filter(Boolean),
    quick_fixes: [
      '1. 登录 Supabase Dashboard → Authentication → URL Configuration',
      '2. 设置 Site URL 为: https://www.maogepdf.com',
      '3. 添加 Redirect URLs: https://www.maogepdf.com/**',
      '4. 检查 Google Cloud Console OAuth 设置',
    ]
  };

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    }
  });
}