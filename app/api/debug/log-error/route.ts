import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const errorInfo = await request.json()
    
    // 在服务器端记录错误
    console.error('🚨 [服务器端] 客户端错误报告:', {
      timestamp: new Date().toISOString(),
      clientError: errorInfo,
      requestHeaders: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin')
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: '错误已记录' 
    })
  } catch (error) {
    console.error('🚨 [服务器端] 记录客户端错误失败:', error)
    return NextResponse.json(
      { success: false, error: '记录失败' }, 
      { status: 500 }
    )
  }
}