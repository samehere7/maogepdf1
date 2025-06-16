import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: { pdfId: string } }) {
  try {
    const pdfId = params.pdfId;
    
    if (!pdfId) {
      return NextResponse.json({ error: '缺少PDF ID' }, { status: 400 });
    }

    console.log('获取PDF信息，ID:', pdfId);

    // 临时解决方案：返回模拟数据用于测试分享功能
    // TODO: 修复数据库权限问题后恢复正常的数据库查询
    
    // 检查是否是有效格式的PDF ID
    if (pdfId.length < 8) {
      return NextResponse.json({ 
        error: 'PDF文件不存在或已被删除',
        details: 'Invalid PDF ID format' 
      }, { status: 404 });
    }

    // 返回模拟的PDF数据
    const mockPDFData = {
      id: pdfId,
      name: `Git快速入门(${pdfId.substring(0, 4)}).pdf`,
      url: '/uploads/Git快速入门(1).pdf', // 使用现有的示例PDF
      size: 1024000,
      upload_date: new Date().toISOString(),
      ownerName: '测试用户'
    };

    console.log('返回模拟PDF信息:', mockPDFData.name);

    return NextResponse.json({
      pdf: mockPDFData,
      error: null
    });

  } catch (error) {
    console.error('获取PDF信息API错误:', error);
    return NextResponse.json({ 
      error: '服务器内部错误',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}