import { NextResponse } from 'next/server';
import { pdfRAGSystem } from '@/lib/pdf-rag-system';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // 检查用户权限（可选，用于调试）
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 获取RAG系统状态
    const stats = pdfRAGSystem.getDocumentStats();
    
    // 获取系统详细信息
    const systemInfo = {
      documentStats: stats,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      },
      memory: {
        used: process.memoryUsage()
      }
    };

    return NextResponse.json({
      status: 'success',
      data: systemInfo
    });

  } catch (error) {
    console.error('[Debug API] RAG状态检查失败:', error);
    return NextResponse.json({
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}