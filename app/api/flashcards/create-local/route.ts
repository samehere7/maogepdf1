import { NextRequest, NextResponse } from 'next/server'

interface FlashcardCreateRequest {
  pdfId: string
  pdfName: string
  pdfContent: string
  contentAmount: 'few' | 'medium' | 'many'
  pageRange?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body: FlashcardCreateRequest = await request.json()
    const { pdfId, pdfName, pdfContent, contentAmount, pageRange } = body

    // 验证必要的参数
    if (!pdfId || !pdfName) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 根据用户选择确定生成数量
    const getFlashcardCount = () => {
      switch (contentAmount) {
        case 'few': return 3
        case 'medium': return 6
        case 'many': return 10
        default: return 6
      }
    }

    const count = getFlashcardCount()
    const flashcards = []

    // 如果有PDF内容，尝试生成基于内容的闪卡
    if (pdfContent && pdfContent.trim().length > 0) {
      // 简单的内容分析生成闪卡
      const contentParts = pdfContent.split(/[.。!！?？\n]+/).filter(part => part.trim().length > 10)
      
      for (let i = 1; i <= count; i++) {
        // 如果有足够的内容，基于内容生成；否则生成通用问题
        if (contentParts.length >= i) {
          const contentPart = contentParts[i - 1].trim()
          flashcards.push({
            id: `${pdfId}_${Date.now()}_${i}`,
            question: `请解释以下内容：${contentPart.substring(0, 50)}...`,
            answer: contentPart,
            difficulty: 0,
            page_number: pageRange ? Math.floor(Math.random() * 10) + 1 : null,
            review_count: 0,
            created_at: new Date().toISOString()
          })
        } else {
          // 生成通用问题
          flashcards.push({
            id: `${pdfId}_${Date.now()}_${i}`,
            question: `关于《${pdfName}》的问题 ${i}`,
            answer: `这是基于《${pdfName}》内容的答案 ${i}。请根据文档内容进行学习。`,
            difficulty: 0,
            page_number: pageRange ? Math.floor(Math.random() * 10) + 1 : null,
            review_count: 0,
            created_at: new Date().toISOString()
          })
        }
      }
    } else {
      // 没有PDF内容时，生成基本的学习卡片
      for (let i = 1; i <= count; i++) {
        flashcards.push({
          id: `${pdfId}_${Date.now()}_${i}`,
          question: `关于《${pdfName}》的学习要点 ${i}`,
          answer: `这是关于《${pdfName}》的学习要点 ${i}。建议结合文档内容进行深入学习。`,
          difficulty: 0,
          page_number: pageRange ? Math.floor(Math.random() * 10) + 1 : null,
          review_count: 0,
          created_at: new Date().toISOString()
        })
      }
    }

    console.log(`[闪卡API] 成功生成 ${flashcards.length} 张闪卡，PDF: ${pdfName}`)

    return NextResponse.json({
      success: true,
      flashcards,
      message: `成功生成 ${flashcards.length} 张闪卡`
    })

  } catch (error) {
    console.error('[闪卡API] 生成闪卡失败:', error)
    return NextResponse.json(
      { error: '生成闪卡失败，请重试' },
      { status: 500 }
    )
  }
}