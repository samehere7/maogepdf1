import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { OpenAI } from 'openai';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import { ModelQuality, createOpenAIClient } from '@/types/api';

// 确保目录存在
async function ensureDir(dirPath: string) {
  try {
    await fs.promises.access(dirPath);
  } catch (error) {
    // 目录不存在，创建它
    await mkdir(dirPath, { recursive: true });
  }
}

// 分块函数
function splitText(text: string, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// 生成模拟embedding向量
function generateMockEmbedding(length = 1536) {
  return Array.from({ length }, () => Math.random() * 2 - 1);
}

// 获取真实embedding
async function getEmbeddings(chunks: string[], quality: ModelQuality) {
  try {
    const client = createOpenAIClient(quality);
    console.log(`使用${quality}质量模式获取embeddings`);
    
    // 这里仍然使用模拟embedding，实际使用时可以替换为真实API调用
    // 真实实现示例:
    /*
    const embeddings = [];
    for (const chunk of chunks) {
      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });
      embeddings.push({
        chunk,
        embedding: response.data[0].embedding,
      });
    }
    return embeddings;
    */
    
    // 模拟实现
    return chunks.map(chunk => ({
      chunk,
      embedding: generateMockEmbedding(),
      quality: quality // 记录使用的质量模式
    }));
  } catch (error) {
    console.error('获取embeddings错误:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    console.log("开始处理上传请求");
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const quality = (formData.get('quality') as ModelQuality) || 'high';
    
    console.log(`使用质量模式: ${quality}`);
    
    if (!file) {
      console.error("没有文件被上传");
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log("接收到文件:", file.name, file.type, file.size);

    // 检查文件类型
    if (!file.type.includes('pdf')) {
      console.error("文件类型不是PDF:", file.type);
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // 获取文件Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 创建uploads目录和embeddings目录（如果不存在）
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const embeddingsDir = path.join(process.cwd(), 'public', 'embeddings');
    
    await ensureDir(uploadsDir);
    await ensureDir(embeddingsDir);
    
    console.log("目录已确保存在:", uploadsDir, embeddingsDir);

    // 保存文件
    const filePath = path.join(uploadsDir, file.name);
    try {
      await writeFile(filePath, buffer);
      console.log("文件已保存:", filePath);
    } catch (error: any) {
      console.error('保存文件错误:', error);
      return NextResponse.json(
        { error: `Error saving file: ${error.message}` },
        { status: 500 }
      );
    }

    // 提取PDF文本
    try {
      console.log("开始提取PDF文本");
      const data = await pdfParse(buffer);
      console.log("PDF文本提取成功, 长度:", data.text.length);
      
      const chunks = splitText(data.text);
      console.log("文本已分块, 块数:", chunks.length);

      // 获取embeddings
      console.log(`使用${quality}质量模式处理文档`);
      const embeddings = await getEmbeddings(chunks, quality);

      // 为每个文档创建单独的embeddings文件
      const fileName = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}-${quality}.json`;
      const embeddingFilePath = path.join(embeddingsDir, fileName);
      
      await writeFile(
        embeddingFilePath,
        JSON.stringify(embeddings)
      );
      console.log("嵌入已保存:", embeddingFilePath);

      return NextResponse.json({
        success: true,
        url: `/uploads/${file.name}`,
        embeddingsFile: fileName,
        chunks: chunks.length,
        quality: quality
      });
    } catch (error: any) {
      console.error('处理PDF错误:', error);
      return NextResponse.json(
        { error: `Error processing PDF: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('上传错误:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
} 