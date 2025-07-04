import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 环境变量检查
    const envCheck = {
      OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
      OPENROUTER_API_KEY_HIGH: !!process.env.OPENROUTER_API_KEY_HIGH,
      OPENROUTER_API_KEY_FREE: !!process.env.OPENROUTER_API_KEY_FREE,
      OPENROUTER_API_KEY_FAST: !!process.env.OPENROUTER_API_KEY_FAST,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };

    // Plus用户配置检查
    const plusConfig = {
      hasHighApiKey: !!process.env.OPENROUTER_API_KEY_HIGH,
      fallbackToMain: !process.env.OPENROUTER_API_KEY_HIGH && !!process.env.OPENROUTER_API_KEY
    };

    console.log('[配置检查] 环境变量状态:', envCheck);
    console.log('[配置检查] Plus用户配置:', plusConfig);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      envCheck,
      plusConfig,
      message: plusConfig.hasHighApiKey 
        ? 'Plus用户配置正常' 
        : plusConfig.fallbackToMain 
          ? 'Plus用户配置缺失，使用主API密钥作为回退'
          : '所有API密钥配置缺失'
    });

  } catch (error) {
    console.error('[配置检查] 检查失败:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}