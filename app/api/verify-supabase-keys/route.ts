import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { anonKey, serviceKey, supabaseUrl } = await request.json()
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    }

    // 测试匿名密钥
    if (anonKey && supabaseUrl) {
      try {
        const anonClient = createClient(supabaseUrl, anonKey)
        const { data, error } = await anonClient.auth.getSession()
        
        results.tests.push({
          keyType: 'Anon Key',
          valid: !error,
          error: error?.message || null,
          key: anonKey.substring(0, 20) + '...'
        })
      } catch (e) {
        results.tests.push({
          keyType: 'Anon Key',
          valid: false,
          error: e instanceof Error ? e.message : 'Unknown error',
          key: anonKey.substring(0, 20) + '...'
        })
      }
    }

    // 测试服务角色密钥
    if (serviceKey && supabaseUrl) {
      try {
        const serviceClient = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        
        // 测试多个操作
        const operations = [
          {
            name: 'List Buckets',
            test: () => serviceClient.storage.listBuckets()
          },
          {
            name: 'Query user_profiles',
            test: () => serviceClient.from('user_profiles').select('count').limit(0)
          },
          {
            name: 'Auth Admin - List Users',
            test: () => serviceClient.auth.admin.listUsers({ page: 1, perPage: 1 })
          }
        ]
        
        const operationResults = []
        for (const op of operations) {
          try {
            const { data, error } = await op.test() as any
            operationResults.push({
              operation: op.name,
              success: !error,
              error: error?.message || null
            })
          } catch (e) {
            operationResults.push({
              operation: op.name,
              success: false,
              error: e instanceof Error ? e.message : 'Unknown error'
            })
          }
        }
        
        results.tests.push({
          keyType: 'Service Role Key',
          valid: operationResults.some(op => op.success),
          operations: operationResults,
          key: serviceKey.substring(0, 20) + '...'
        })
        
      } catch (e) {
        results.tests.push({
          keyType: 'Service Role Key',
          valid: false,
          error: e instanceof Error ? e.message : 'Client creation failed',
          key: serviceKey.substring(0, 20) + '...'
        })
      }
    }

    return NextResponse.json(results)
    
  } catch (error) {
    return NextResponse.json({
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  // 测试当前配置的密钥
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return NextResponse.json({
      error: 'Missing environment variables',
      missing: {
        supabaseUrl: !supabaseUrl,
        anonKey: !anonKey,
        serviceKey: !serviceKey
      }
    }, { status: 500 })
  }
  
  // 测试当前密钥
  const request = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify({
      supabaseUrl,
      anonKey,
      serviceKey
    }),
    headers: { 'Content-Type': 'application/json' }
  })
  
  return POST(request)
}