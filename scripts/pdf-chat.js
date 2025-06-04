const fs = require('fs');
const { OpenAI } = require('openai');

// 1. 读取 embedding 数据
const data = JSON.parse(fs.readFileSync('pdf-embeddings.json', 'utf-8'));

// 2. 计算余弦相似度
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 3. 获取问题 embedding
async function getQuestionEmbedding(question, apiKey) {
  const openai = new OpenAI({ apiKey });
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: [question],
  });
  return response.data[0].embedding;
}

// 4. 主流程
async function main() {
  const question = process.argv.slice(2).join(' ');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!question) {
    console.error('请在命令行输入你的问题');
    process.exit(1);
  }
  if (!apiKey) {
    console.error('请设置OPENAI_API_KEY环境变量');
    process.exit(1);
  }
  // 获取问题 embedding
  const qEmbedding = await getQuestionEmbedding(question, apiKey);
  // 计算与每个 chunk 的相似度
  const scored = data.map(item => ({
    chunk: item.chunk,
    score: cosineSimilarity(qEmbedding, item.embedding)
  }));
  // 取分数最高的3个片段
  const topChunks = scored.sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.chunk);

  // 拼接 prompt
  const prompt = `请根据以下PDF内容片段，回答用户的问题。\n\nPDF片段：\n${topChunks.join('\n---\n')}\n\n用户问题：${question}\n\n请用简洁、专业的语言回答。`;

  // 用GPT生成答案
  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
  console.log('\nAI回答：\n', completion.choices[0].message.content);
}

main(); 