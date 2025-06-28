import { NextRequest, NextResponse } from 'next/server'

interface FlashcardCreateRequest {
  pdfId: string
  pdfName: string
  pdfContent: string
  contentAmount: 'few' | 'medium' | 'many'
  pageRange?: string | null
}

interface FlashcardItem {
  id: string
  question: string
  answer: string
  difficulty: number
  page_number?: number | null
  review_count: number
  created_at: string
}

interface ContentAnalysis {
  keyTerms: string[]
  importantConcepts: string[]
  processes: string[]
  definitions: string[]
  contentType: 'technical' | 'academic' | 'tutorial' | 'general'
}

// 分析PDF内容，提取关键信息
function analyzeContentForFlashcards(content: string): ContentAnalysis {
  const lowerContent = content.toLowerCase()
  
  // 提取关键术语
  const keyTerms: string[] = []
  const techTerms = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || []
  const chineseTerms = content.match(/[\u4e00-\u9fa5]{2,6}/g) || []
  
  keyTerms.push(...techTerms.slice(0, 10))
  keyTerms.push(...chineseTerms.filter(term => term.length >= 3).slice(0, 10))
  
  // 提取重要概念（通常在句子开头或定义中）
  const concepts: string[] = []
  const conceptPatterns = [
    /(?:是|指|表示|意味着|定义为)([^。！？\n]{10,50})/g,
    /([^。！？\n]{10,50})(?:是|指|表示)/g
  ]
  
  conceptPatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      concepts.push(...matches.slice(0, 5))
    }
  })
  
  // 提取步骤和过程
  const processes: string[] = []
  const processPatterns = [
    /第[一二三四五六七八九十\d]+步[：:]?([^。！？\n]{10,100})/g,
    /步骤\s*\d+[：:]?([^。！？\n]{10,100})/g,
    /首先([^。！？\n]{10,100})/g,
    /然后([^。！？\n]{10,100})/g,
    /最后([^。！？\n]{10,100})/g
  ]
  
  processPatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      processes.push(...matches.slice(0, 3))
    }
  })
  
  // 提取定义
  const definitions: string[] = []
  const definitionPatterns = [
    /([^。！？\n]+)是指([^。！？\n]{10,100})/g,
    /([^。！？\n]+)定义为([^。！？\n]{10,100})/g
  ]
  
  definitionPatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      definitions.push(...matches.slice(0, 3))
    }
  })
  
  // 判断内容类型
  let contentType: ContentAnalysis['contentType'] = 'general'
  if (lowerContent.includes('api') || lowerContent.includes('函数') || lowerContent.includes('方法')) {
    contentType = 'technical'
  } else if (lowerContent.includes('研究') || lowerContent.includes('论文') || lowerContent.includes('study')) {
    contentType = 'academic'
  } else if (lowerContent.includes('教程') || lowerContent.includes('入门') || lowerContent.includes('tutorial')) {
    contentType = 'tutorial'
  }
  
  return {
    keyTerms: [...new Set(keyTerms)].slice(0, 8),
    importantConcepts: [...new Set(concepts)].slice(0, 5),
    processes: [...new Set(processes)].slice(0, 5),
    definitions: [...new Set(definitions)].slice(0, 5),
    contentType
  }
}

// AI闪卡生成函数
async function generateIntelligentFlashcards(
  pdfId: string,
  pdfName: string,
  pdfContent: string,
  count: number,
  pageRange?: string | null
): Promise<FlashcardItem[]> {
  try {
    console.log(`[闪卡AI] 开始生成智能闪卡，数量: ${count}`)
    
    // 直接分析PDF内容，提取关键信息用于闪卡生成
    const contentAnalysis = analyzeContentForFlashcards(pdfContent)

    // 构建AI提示词
    const prompt = `你是一个专业的教育内容创作者，需要基于PDF文档内容生成高质量的学习闪卡。

文档信息：
- 文件名：${pdfName}
- 内容类型：${contentAnalysis.contentType}
- 关键术语：${contentAnalysis.keyTerms.join(', ')}
- 重要概念：${contentAnalysis.importantConcepts.slice(0, 3).join('; ')}
- 主要过程：${contentAnalysis.processes.slice(0, 2).join('; ')}
- 内容摘要：${pdfContent.substring(0, 400)}...

请生成 ${count} 张闪卡，要求：
1. **问题设计**：
   - 涵盖文档的关键概念、重要定义、核心过程
   - 问题要有教育价值，促进深度思考
   - 避免过于简单的是非题，多设计解释性问题
   - 问题要具体明确，避免模糊表述

2. **答案要求**：
   - 基于文档实际内容，准确完整
   - 适当的详细程度，既不过于简单也不过于复杂
   - 可以包含关键词、步骤、定义等
   - 必要时可以举例说明

3. **页码标注**：
   - 尽量根据内容推测合理的页码范围
   - 如果是概念性内容，可以标注为前几页
   - 如果是实践内容，可以标注为中后段页码

4. **输出格式**：
请严格按照以下JSON格式输出，不要包含任何其他文字：
[
  {
    "question": "问题内容",
    "answer": "详细答案",
    "page_number": 页码数字
  }
]

请开始生成闪卡：`

    // 调用OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Maoge PDF Flashcard Generator'
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "你是一个专业的教育内容创作者，擅长基于文档内容生成高质量的学习闪卡。请严格按照用户要求的JSON格式输出结果。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''
    
    console.log(`[闪卡AI] AI原始响应:`, aiResponse.substring(0, 200))

    // 解析AI响应
    let aiFlashcards: any[] = []
    try {
      // 尝试提取JSON部分
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        aiFlashcards = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('AI响应中未找到有效的JSON格式')
      }
    } catch (parseError) {
      console.error('[闪卡AI] JSON解析失败:', parseError)
      throw new Error('AI响应格式解析失败')
    }

    // 转换为标准闪卡格式
    const flashcards: FlashcardItem[] = aiFlashcards.slice(0, count).map((item, index) => ({
      id: `${pdfId}_${Date.now()}_${index + 1}`,
      question: item.question || `关于《${pdfName}》的问题 ${index + 1}`,
      answer: item.answer || `基于《${pdfName}》内容的答案 ${index + 1}`,
      difficulty: 0,
      page_number: item.page_number || null,
      review_count: 0,
      created_at: new Date().toISOString()
    }))

    console.log(`[闪卡AI] 成功生成 ${flashcards.length} 张智能闪卡`)
    return flashcards

  } catch (error) {
    console.error('[闪卡AI] 智能生成失败:', error)
    throw error
  }
}

// 降级方案：基于内容生成基础闪卡
function generateBasicFlashcards(
  pdfId: string,
  pdfName: string,
  pdfContent: string,
  count: number
): FlashcardItem[] {
  console.log(`[闪卡基础] 使用降级方案生成基础闪卡`)
  
  const flashcards: FlashcardItem[] = []
  
  if (pdfContent && pdfContent.trim().length > 0) {
    // 提取有意义的内容段落
    const contentParts = pdfContent
      .split(/[.。!！?？\n]+/)
      .filter(part => part.trim().length > 20)
      .slice(0, count * 2) // 取更多内容以供选择
    
    for (let i = 0; i < count; i++) {
      if (contentParts.length > i) {
        const contentPart = contentParts[i].trim()
        flashcards.push({
          id: `${pdfId}_${Date.now()}_${i + 1}`,
          question: `请解释文档中提到的：${contentPart.substring(0, 40)}...`,
          answer: contentPart,
          difficulty: 0,
          page_number: Math.floor((i / count) * 10) + 1, // 简单的页码估算
          review_count: 0,
          created_at: new Date().toISOString()
        })
      } else {
        flashcards.push({
          id: `${pdfId}_${Date.now()}_${i + 1}`,
          question: `关于《${pdfName}》的学习要点 ${i + 1}`,
          answer: `这是基于《${pdfName}》内容的学习要点 ${i + 1}。建议结合文档内容进行深入学习。`,
          difficulty: 0,
          page_number: null,
          review_count: 0,
          created_at: new Date().toISOString()
        })
      }
    }
  } else {
    // 完全没有内容时的最基础方案
    for (let i = 0; i < count; i++) {
      flashcards.push({
        id: `${pdfId}_${Date.now()}_${i + 1}`,
        question: `关于《${pdfName}》的学习要点 ${i + 1}`,
        answer: `这是关于《${pdfName}》的学习要点 ${i + 1}。建议结合文档内容进行深入学习。`,
        difficulty: 0,
        page_number: null,
        review_count: 0,
        created_at: new Date().toISOString()
      })
    }
  }
  
  return flashcards
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
    console.log(`[闪卡API] 开始生成闪卡，PDF: ${pdfName}, 数量: ${count}`)

    let flashcards: FlashcardItem[] = []

    // 尝试使用AI生成智能闪卡
    try {
      if (pdfContent && pdfContent.trim().length > 100) {
        console.log('[闪卡API] 使用AI生成智能闪卡')
        flashcards = await generateIntelligentFlashcards(pdfId, pdfName, pdfContent, count, pageRange)
      } else {
        throw new Error('PDF内容不足，使用降级方案')
      }
    } catch (aiError) {
      console.warn('[闪卡API] AI生成失败，使用降级方案:', aiError)
      flashcards = generateBasicFlashcards(pdfId, pdfName, pdfContent, count)
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