import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { OpenAI } from 'openai';
import { getPDF } from '@/lib/pdf-service';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';
import { callOpenRouterChat, ModelQuality } from '../../utils/openrouter';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

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
      // 新增：直接抛出404错误
      const err: any = new Error("PDF尚未解析，请稍后再试或重新上传。");
      err.status = 404;
      throw err;
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
      apiKey: process.env.OPENROUTER_API_KEY_FAST,
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

async function loadEmbeddings(pdfId: string): Promise<any[]> {
  try {
    // 从数据库获取PDF的embeddings文件路径
    const pdf = await prisma.pDF.findUnique({
      where: { id: pdfId }
    });

    // 暂时返回空数组，因为embeddings功能已移除
    return [];
  } catch (error) {
    console.error('加载embeddings错误:', error);
    return [];
  }
}

async function findSimilarChunks(query: string, embeddings: any[], topK: number = 3): Promise<string[]> {
  try {
    if (embeddings.length === 0) {
      return ["没有找到相关文档内容。"];
    }
    
    // 获取查询的embedding
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    
    const queryEmbedding = response.data[0].embedding;

    // 计算相似度并排序
    const similarities = embeddings.map((item: any) => ({
      chunk: item.chunk,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK).map(item => item.chunk);
  } catch (error) {
    console.error('查找相似文本块错误:', error);
    return embeddings.slice(0, topK).map((item: any) => item.chunk);
  }
}

export async function POST(req: Request) {
  try {
    // 检查用户是否已登录
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { messages, pdfId } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '无效的消息格式' }, { status: 400 });
    }

    if (!pdfId) {
      return NextResponse.json({ error: '未提供PDF ID' }, { status: 400 });
    }

    // 检查用户是否有权限访问该PDF
    const pdf = await getPDF(pdfId, session.user.email);
    if (!pdf) {
      return NextResponse.json({ error: '无权访问该PDF' }, { status: 403 });
    }
    
    // 加载embeddings
    const embeddings = await loadEmbeddings(pdfId);
    
    if (embeddings.length === 0) {
      return NextResponse.json({ 
        content: "抱歉，我无法访问文档内容。请确保文档已正确上传并处理。", 
        role: "assistant" 
      });
    }

    // 获取最后一条用户消息
    const lastUserMessage = messages[messages.length - 1].content;

    // 查找相关文本块
    const relevantChunks = await findSimilarChunks(lastUserMessage, embeddings);

    // 构建系统提示
    const systemPrompt = `你是一个专业的文档助手。请基于以下文档内容回答用户的问题。如果问题超出文档范围，请明确告知。

相关文档内容：
${relevantChunks.join('\n\n')}

请用简洁、专业的语言回答，必要时可以使用markdown格式。`;

    // 准备消息列表
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 调用ChatGPT API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: chatMessages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json({
      content: completion.choices[0].message.content,
      role: 'assistant'
    });
  } catch (error) {
    console.error('聊天API错误:', error);
    return NextResponse.json({
      content: "处理您的问题时出错了。请稍后再试。",
      role: "assistant"
    });
  }
} 