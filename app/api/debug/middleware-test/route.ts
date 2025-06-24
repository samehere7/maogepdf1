import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // 模拟中间件的逻辑
    const pathname = url.pathname;
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    const isValidLocale = locales.includes(firstSegment as any);
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      input: {
        originalUrl: request.url,
        pathname: pathname,
        pathSegments: pathSegments,
        firstSegment: firstSegment,
      },
      middleware_logic: {
        locales: locales,
        defaultLocale: defaultLocale,
        isValidLocale: isValidLocale,
        shouldHavePrefix: firstSegment !== defaultLocale,
        detectedLocale: isValidLocale ? firstSegment : defaultLocale,
      },
      expected_behavior: {
        if_root_path: {
          input: '/',
          expected_locale: defaultLocale,
          expected_rewrite: '/en',
          should_work: true,
        },
        if_zh_path: {
          input: '/zh',
          expected_locale: 'zh',
          expected_rewrite: '/zh',
          should_work: true,
        }
      },
      current_analysis: {
        current_path: pathname,
        is_root: pathname === '/',
        needs_locale_handling: pathname === '/' || !isValidLocale,
        recommended_action: pathname === '/' ? 'rewrite_to_/en' : 'keep_as_is',
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
      error: 'Middleware test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}