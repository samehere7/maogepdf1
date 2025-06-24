import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 这个API专门用于分析中间件行为
    const url = new URL(request.url);
    const targetPath = url.searchParams.get('path') || '/';
    
    // 模拟中间件逻辑的详细分析
    const analysis = {
      timestamp: new Date().toISOString(),
      targetPath,
      middleware_analysis: {
        // 步骤1: 路径解析
        step1_path_parsing: {
          original_path: targetPath,
          pathname: targetPath,
          segments: targetPath.split('/').filter(Boolean),
          first_segment: targetPath.split('/').filter(Boolean)[0],
        },
        
        // 步骤2: Locale检测
        step2_locale_detection: (() => {
          const segments = targetPath.split('/').filter(Boolean);
          const firstSegment = segments[0];
          const locales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt-BR', 'ru', 'it', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'tr', 'hi', 'bn', 'pa', 'kn', 'th', 'vi', 'id', 'ms'];
          const isValidLocale = locales.includes(firstSegment);
          
          return {
            first_segment: firstSegment,
            is_valid_locale: isValidLocale,
            detected_locale: isValidLocale ? firstSegment : 'en',
            needs_rewrite: !isValidLocale && targetPath === '/',
          };
        })(),
        
        // 步骤3: next-intl行为预测
        step3_nextintl_behavior: (() => {
          const isRoot = targetPath === '/';
          const hasLocalePrefix = targetPath.startsWith('/zh') || targetPath.startsWith('/ja') || targetPath.startsWith('/en');
          
          return {
            is_root_path: isRoot,
            has_locale_prefix: hasLocalePrefix,
            expected_action: isRoot ? 'rewrite_to_/en_but_keep_url_as_/' : 'pass_through',
            localePrefix_setting: 'as-needed',
            defaultLocale: 'en',
          };
        })(),
        
        // 步骤4: 我的自定义中间件逻辑
        step4_custom_middleware: (() => {
          const isRoot = targetPath === '/';
          
          return {
            triggers_custom_logic: isRoot,
            action_taken: isRoot ? 'force_set_NEXT_LOCALE_to_en' : 'pass_to_intl_middleware',
            potential_conflict: 'Setting cookie might cause rewrite conflict',
          };
        })(),
        
        // 步骤5: 潜在问题识别
        step5_problem_identification: {
          potential_issues: [
            'Custom middleware setting cookie conflicts with next-intl rewrite',
            'Response modification after next-intl processing might cause loop',
            'Cookie setting in middleware can trigger additional processing',
            'next-intl might see the cookie and think it needs to redirect again'
          ],
          likely_cause: 'Cookie modification in middleware causing reprocessing loop',
          suggested_fix: 'Remove cookie modification from middleware, handle in layout instead'
        }
      },
      
      current_request_info: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        cookies: Object.fromEntries(
          request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
        ),
      }
    };
    
    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Middleware trace failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}