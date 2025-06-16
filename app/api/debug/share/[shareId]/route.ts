import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { shareId: string } }) {
  try {
    const shareId = params.shareId;
    
    if (!shareId) {
      return NextResponse.json({ error: '缺少分享ID' }, { status: 400 });
    }

    // 解析分享ID
    const parts = shareId.split('-');
    const pdfId = parts[0];
    const timestamp = parts[1];
    const randomId = parts[2];

    // 验证格式
    const isValidFormat = parts.length >= 2 && pdfId && timestamp;
    
    // 尝试获取PDF信息
    let pdfApiStatus = 'unknown';
    let pdfData = null;
    
    try {
      const pdfResponse = await fetch(`${req.nextUrl.origin}/api/share/pdf/${pdfId}`);
      pdfApiStatus = pdfResponse.ok ? 'available' : 'not_found';
      if (pdfResponse.ok) {
        pdfData = await pdfResponse.json();
      }
    } catch (error) {
      pdfApiStatus = 'error';
    }

    const debugInfo = {
      shareId,
      parsing: {
        parts,
        pdfId,
        timestamp: timestamp ? new Date(parseInt(timestamp)).toISOString() : null,
        randomId,
        isValidFormat
      },
      pdf: {
        status: pdfApiStatus,
        data: pdfData
      },
      routes: {
        sharePageUrl: `${req.nextUrl.origin}/share/${shareId}`,
        homeRedirectUrl: `${req.nextUrl.origin}/?share=${encodeURIComponent(shareId)}`,
        pdfApiUrl: `${req.nextUrl.origin}/api/share/pdf/${pdfId}`
      },
      server: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        origin: req.nextUrl.origin
      }
    };

    return NextResponse.json({
      status: 'debug',
      shareId,
      isValid: isValidFormat && pdfApiStatus === 'available',
      debug: debugInfo
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      shareId: params.shareId
    }, { status: 500 });
  }
}