import { NextResponse } from 'next/server';

// 服务端使用动态导入PDF.js
let pdfjsLib: any = null;

async function loadPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    // 服务端不需要Worker配置
  }
  return pdfjsLib;
}

// 用户限制配置
const FREE_USER_MAX_PAGES = 120; // 免费用户页数限制
const PLUS_USER_MAX_PAGES = 2000; // Plus用户页数限制

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const isPlus = formData.get('isPlus') === 'true';
    
    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400 });
    }

    console.log(`[页数检查] 开始检查文件: ${file.name}, 大小: ${file.size}, Plus: ${isPlus}`);

    // 将文件转换为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 使用PDF.js解析PDF获取页数
    try {
      const pdfjs = await loadPdfjs();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      
      console.log(`[页数检查] PDF页数: ${numPages}`);
      
      // 检查页数限制
      const maxPages = isPlus ? PLUS_USER_MAX_PAGES : FREE_USER_MAX_PAGES;
      const exceedsLimit = numPages > maxPages;
      
      if (exceedsLimit) {
        const userType = isPlus ? 'Plus用户' : '免费用户';
        console.log(`[页数检查] ${userType}页数超限: ${numPages} > ${maxPages}`);
        
        return NextResponse.json({
          success: false,
          exceedsLimit: true,
          numPages,
          maxPages,
          userType: isPlus ? 'plus' : 'free',
          message: isPlus 
            ? `Plus用户最多支持${PLUS_USER_MAX_PAGES}页PDF，当前文件${numPages}页`
            : `免费用户最多支持${FREE_USER_MAX_PAGES}页PDF，当前文件${numPages}页，请升级到Plus解锁2000页限制`
        });
      }

      return NextResponse.json({
        success: true,
        exceedsLimit: false,
        numPages,
        maxPages,
        userType: isPlus ? 'plus' : 'free',
        message: `页数检查通过，${numPages}页在${isPlus ? 'Plus' : '免费'}用户限制内`
      });

    } catch (pdfError) {
      console.error('[页数检查] PDF解析失败:', pdfError);
      return NextResponse.json({ 
        error: '无法解析PDF文件，请确保文件格式正确',
        details: pdfError instanceof Error ? pdfError.message : '未知错误'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[页数检查] 处理失败:', error);
    return NextResponse.json({ 
      error: '页数检查失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: '页数检查端点',
    limits: {
      free: FREE_USER_MAX_PAGES,
      plus: PLUS_USER_MAX_PAGES
    }
  });
}