import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { OpenAI } from 'openai';
import { callOpenRouterChat, ModelQuality } from '../../utils/openrouter';
import fs from 'fs';

// 计算余弦相似度
function cosineSimilarity(a: number[], b: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 从文件中获取PDF内容
async function getPdfContent(embeddingsFileName: string) {
  try {
    // 构建完整的文件路径
    const embeddingsDir = path.join(process.cwd(), 'public', 'embeddings');
    const embeddingsFilePath = path.join(embeddingsDir, embeddingsFileName);
    
    console.log("尝试读取embeddings文件:", embeddingsFilePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(embeddingsFilePath)) {
      console.error("Embeddings文件不存在:", embeddingsFilePath);
      return [];
    }
    
    // 读取文件内容
    const content = await fs.promises.readFile(embeddingsFilePath, 'utf-8');
    const data = JSON.parse(content);
    
    console.log(`成功读取embeddings文件，包含${data.length}个文本块`);
    
    // 返回文本块
    return data.map((item: any) => item.chunk);
  } catch (error) {
    console.error('读取PDF内容错误:', error);
    return [];
  }
}

// 生成模拟embedding向量
function generateMockEmbedding(length = 1536) {
  return Array.from({ length }, () => Math.random() * 2 - 1);
}

// 生成模拟回答
function generateMockAnswer(question: string, chunks: string[], quality: ModelQuality) {
  const combinedText = chunks.join('\n');
  const shortText = combinedText.slice(0, 200) + '...';
  
  if (quality === 'fast') {
    return `[快速模式] 这是对问题"${question}"的模拟回答。\n\n根据文档内容，我找到了以下相关信息：\n\n${shortText}\n\n希望这个回答对您有所帮助！`;
  } else {
    return `[高质量模式] 这是对问题"${question}"的详细模拟回答。\n\n根据文档内容，我找到了以下相关信息：\n\n${shortText}\n\n基于上述内容，我可以提供更深入的分析...\n\n希望这个详细回答对您有所帮助！`;
  }
}

// 获取真实回答
async function getAnswer(question: string, chunks: string[], quality: ModelQuality) {
  try {
    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://maoge.pdf',
        'X-Title': 'Maoge PDF',
      }
    });
    console.log(`使用${quality}质量模式获取回答`);
    
    // 这里仍然使用模拟回答，实际使用时可以替换为真实API调用
    // 真实实现示例:
    /*
    const context = chunks.join('\n\n');
    const response = await client.chat.completions.create({
      model: MODEL_CONFIGS[quality].model,
      messages: [
        {
          role: "system",
          content: "你是一个有用的AI助手，专门用于回答PDF文档中的问题。请基于提供的上下文回答问题，如果答案不在上下文中，请说你不知道。"
        },
        {
          role: "user",
          content: `上下文信息：\n${context}\n\n问题：${question}`
        }
      ],
    });
    
    return response.choices[0].message.content || "无法生成回答";
    */
    
    // 模拟实现
    return generateMockAnswer(question, chunks, quality);
  } catch (error) {
    console.error('获取回答错误:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  console.log('收到 /api/chat 请求');
  try {
    const { question, embeddingsFile, quality = 'fast' } = await req.json();
    if (!question) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    // 获取PDF内容（如有）
    let pdfContent = '';
    if (embeddingsFile) {
      const pdfChunks = await getPdfContent(embeddingsFile);
      pdfContent = pdfChunks.join('\n\n');
    }
    // 组装messages
    const messages = [
      {
        role: 'system',
        content: pdfContent
          ? `你是一个专业的PDF文档助手。请基于以下PDF文档内容回答问题。\n如果问题超出了文档范围，请礼貌地告知用户。回答要准确、简洁、专业。\n\n文档内容:\n${pdfContent.length > 8000 ? pdfContent.slice(0, 8000) + '...' : pdfContent}`
          : '你是一个专业的PDF文档助手。请准确、简洁、专业地回答用户问题。'
      },
      {
        role: 'user',
        content: question
      }
    ];
    // 调用大模型
    const answer = await callOpenRouterChat({ messages, quality });
    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('chat接口错误:', error);
    return NextResponse.json({ error: error.message || '服务器内部错误' }, { status: 500 });
  }
} 