import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabaseConfig: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
      }
    };

    // 检查Supabase连接
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      diagnosis.auth = {
        hasUser: !!user,
        userId: user?.id || null,
        userEmail: user?.email || null,
        authError: authError?.message || null
      };
    } catch (authCheckError) {
      diagnosis.auth = {
        error: authCheckError.message
      };
    }

    // 检查数据库连接
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: testQuery, error: dbError } = await serviceClient
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      diagnosis.database = {
        connected: !dbError,
        error: dbError?.message || null,
        sampleDataFound: !!testQuery?.length
      };
    } catch (dbCheckError) {
      diagnosis.database = {
        error: dbCheckError.message
      };
    }

    // 检查存储
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const serviceClient = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: buckets, error: storageError } = await serviceClient.storage.listBuckets();
      
      diagnosis.storage = {
        connected: !storageError,
        error: storageError?.message || null,
        bucketsFound: buckets?.map(b => b.name) || []
      };
    } catch (storageCheckError) {
      diagnosis.storage = {
        error: storageCheckError.message
      };
    }

    return NextResponse.json(diagnosis);
  } catch (error) {
    return NextResponse.json({
      error: 'Diagnosis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 简单测试上传端点是否可以处理请求
    const contentType = req.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({
        error: 'Invalid content type',
        expected: 'multipart/form-data',
        received: contentType
      }, { status: 400 });
    }

    // 检查认证
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({
        error: 'Authentication required',
        authError: authError?.message || 'No user found'
      }, { status: 401 });
    }

    // 尝试解析FormData
    try {
      const formData = await req.formData();
      const file = formData.get('file');
      
      return NextResponse.json({
        message: 'Upload endpoint is working',
        user: {
          id: user.id,
          email: user.email
        },
        fileReceived: !!file,
        fileName: file instanceof File ? file.name : null,
        fileSize: file instanceof File ? file.size : null
      });
    } catch (formError) {
      return NextResponse.json({
        error: 'FormData parsing failed',
        message: formError instanceof Error ? formError.message : 'Unknown form error'
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'POST diagnosis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}