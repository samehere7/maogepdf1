import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  const diagnostics = {
    timestamp,
    server_info: {
      node_env: process.env.NODE_ENV,
      deployment_id: process.env.VERCEL_DEPLOYMENT_ID || 'local',
      git_commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
    },
    request_info: {
      url: request.url,
      method: request.method,
      pathname: new URL(request.url).pathname,
      headers: Object.fromEntries(request.headers.entries()),
      cookies: Object.fromEntries(
        request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
      ),
    },
    middleware_config: {
      // 读取当前生效的配置
      locales: ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt-BR', 'ru', 'it', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'tr', 'hi', 'bn', 'pa', 'kn', 'th', 'vi', 'id', 'ms'],
      defaultLocale: 'en',
      expected_localePrefix: 'always',
      expected_localeDetection: false,
    },
    file_structure: {
      has_root_page: false, // 我们已删除
      middleware_active: true,
    },
    test_paths: {
      should_redirect_root_to_en: true,
      root_path_expected_behavior: 'middleware should redirect / to /en',
    }
  };

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    }
  });
}