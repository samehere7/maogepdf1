import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const testUrl = url.searchParams.get('url') || '/';
    
    // 测试指定URL的重定向行为
    const results = [];
    let currentUrl = new URL(testUrl, url.origin);
    let redirectCount = 0;
    const maxRedirects = 10;
    
    while (redirectCount < maxRedirects) {
      try {
        console.log(`Testing redirect ${redirectCount + 1}: ${currentUrl.href}`);
        
        const response = await fetch(currentUrl.href, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': request.headers.get('user-agent') || 'Debug-Bot',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          }
        });
        
        const result = {
          step: redirectCount + 1,
          url: currentUrl.href,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          isRedirect: response.status >= 300 && response.status < 400,
          location: response.headers.get('location'),
          setCookie: response.headers.get('set-cookie'),
        };
        
        results.push(result);
        
        // 如果不是重定向，停止
        if (!result.isRedirect) {
          break;
        }
        
        // 获取重定向URL
        const location = response.headers.get('location');
        if (!location) {
          results.push({
            error: 'Redirect response without Location header',
            step: redirectCount + 2
          });
          break;
        }
        
        // 解析新URL
        try {
          currentUrl = new URL(location, currentUrl.href);
        } catch (e) {
          results.push({
            error: `Invalid redirect URL: ${location}`,
            step: redirectCount + 2
          });
          break;
        }
        
        redirectCount++;
      } catch (fetchError) {
        results.push({
          step: redirectCount + 1,
          url: currentUrl.href,
          error: fetchError.message,
        });
        break;
      }
    }
    
    if (redirectCount >= maxRedirects) {
      results.push({
        error: 'Maximum redirects exceeded - likely redirect loop',
        maxRedirects
      });
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testUrl: testUrl,
      redirectCount,
      hasLoop: redirectCount >= maxRedirects,
      results,
      analysis: {
        finalStatus: results[results.length - 1]?.status,
        redirectChain: results.map(r => r.url).filter(Boolean),
        cookies: results.map(r => r.setCookie).filter(Boolean),
        suspectedLoop: redirectCount >= 3 && results.length > 1,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Redirect test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}