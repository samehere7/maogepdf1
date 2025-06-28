import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('[Test Upload] Request received');
    
    // 检查Content-Length
    const contentLength = req.headers.get('content-length');
    console.log('[Test Upload] Content-Length:', contentLength);
    
    // 检查Content-Type
    const contentType = req.headers.get('content-type');
    console.log('[Test Upload] Content-Type:', contentType);
    
    // 尝试读取请求体的大小
    let bodySize = 0;
    let fileName = 'unknown';
    
    try {
      const formData = await req.formData();
      const file = formData.get('file');
      
      if (file instanceof File) {
        bodySize = file.size;
        fileName = file.name;
        console.log('[Test Upload] File received:', fileName, 'Size:', bodySize);
      } else {
        console.log('[Test Upload] No file found in FormData');
      }
    } catch (formError) {
      console.error('[Test Upload] FormData parsing error:', formError);
      return NextResponse.json({
        error: 'FormData parsing failed',
        details: formError instanceof Error ? formError.message : 'Unknown error',
        contentLength,
        contentType
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      fileName,
      fileSize: bodySize,
      fileSizeMB: Math.round((bodySize / 1024 / 1024) * 100) / 100,
      contentLength,
      contentType,
      message: 'File upload test successful'
    });
    
  } catch (error) {
    console.error('[Test Upload] Error:', error);
    return NextResponse.json({
      error: 'Test upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test upload endpoint is working',
    maxSize: '50MB (theoretical)',
    note: 'Use POST with FormData to test file upload'
  });
}