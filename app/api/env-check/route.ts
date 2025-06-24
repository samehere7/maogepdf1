import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      variables: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        PADDLE_API_KEY: !!process.env.PADDLE_API_KEY,
        PADDLE_WEBHOOK_SECRET: !!process.env.PADDLE_WEBHOOK_SECRET,
        PADDLE_ENVIRONMENT: process.env.PADDLE_ENVIRONMENT,
        PADDLE_TEST_MODE: process.env.PADDLE_TEST_MODE,
        OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
        ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL
      },
      prismaStatus: 'unknown'
    }

    // 测试 Prisma 能否读取 schema
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      envCheck.prismaStatus = 'client_created'
      
      // 尝试连接
      await prisma.$connect()
      envCheck.prismaStatus = 'connected'
      
      // 尝试查询
      await prisma.$queryRaw`SELECT 1 as test`
      envCheck.prismaStatus = 'query_success'
      
      await prisma.$disconnect()
    } catch (prismaError) {
      envCheck.prismaStatus = 'error'
      // @ts-ignore
      envCheck.prismaError = prismaError instanceof Error ? prismaError.message : 'Unknown error'
    }

    return NextResponse.json(envCheck)
  } catch (error) {
    return NextResponse.json({
      error: 'Environment check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}