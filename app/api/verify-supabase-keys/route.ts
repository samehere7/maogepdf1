import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {}
  };

  // 测试匿名密钥
  try {
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data, error } = await anonClient.from('pdfs').select('count').limit(1);
    results.tests.anonKey = {
      status: error ? 'failed' : 'success',
      error: error?.message,
      hasData: !!data
    };
  } catch (e) {
    results.tests.anonKey = {
      status: 'failed',
      error: String(e)
    };
  }

  // 测试服务角色密钥
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const { data, error } = await serviceClient.from('pdfs').select('count').limit(1);
    results.tests.serviceKey = {
      status: error ? 'failed' : 'success',
      error: error?.message,
      hasData: !!data
    };
  } catch (e) {
    results.tests.serviceKey = {
      status: 'failed',
      error: String(e)
    };
  }

  // 环境变量检查
  results.tests.envVars = {
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SERVICE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
  };

  return NextResponse.json(results);
}