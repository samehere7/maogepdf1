const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');

// 1. 读取PDF文本
async function extractPdfText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// 2. 分块
function splitText(text, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// 3. 获取embedding
async function getEmbeddings(texts, apiKey) {
  const openai = new OpenAI({ apiKey });
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: texts,
  });
  return response.data.map(item => item.embedding);
}

// 4. 主流程
async function main() {
  const filePath = process.argv[2];
  const apiKey = process.env.OPENAI_API_KEY;
  if (!filePath) {
    console.error('请指定PDF文件路径，如: node scripts/pdf-embed.js ./test.pdf');
    process.exit(1);
  }
  if (!apiKey) {
    console.error('请设置OPENAI_API_KEY环境变量');
    process.exit(1);
  }
  console.log('正在解析PDF...');
  const text = await extractPdfText(filePath);
  const chunks = splitText(text, 500);
  console.log(`共分为${chunks.length}块，开始获取embedding...`);
  const embeddings = await getEmbeddings(chunks, apiKey);
  chunks.forEach((chunk, i) => {
    console.log(`--- Chunk ${i + 1} ---`);
    console.log(chunk.slice(0, 100) + '...');
    console.log('Embedding:', embeddings[i].slice(0, 5), '...');
  });
  // 保存到json
  const output = chunks.map((chunk, i) => ({
    chunk,
    embedding: embeddings[i]
  }));
  fs.writeFileSync('pdf-embeddings.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('已保存到 pdf-embeddings.json');
}

main(); 