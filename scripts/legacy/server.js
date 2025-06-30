const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.json());
app.use(cors());

const EMBEDDING_FILE = 'pdf-embeddings.json';

// 分块
function splitText(text, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

// 余弦相似度
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 上传PDF并入库
app.post('/api/pdf/upload', upload.single('file'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '缺少OPENAI_API_KEY' });
  const filePath = req.file.path;
  const openai = new OpenAI({ apiKey });

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const chunks = splitText(data.text, 500);
    const embeddingResp = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: chunks,
    });
    const output = chunks.map((chunk, i) => ({
      chunk,
      embedding: embeddingResp.data[i].embedding,
    }));
    fs.writeFileSync(EMBEDDING_FILE, JSON.stringify(output, null, 2), 'utf-8');
    fs.unlinkSync(filePath);
    res.json({ success: true, chunks: output.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 问答接口
app.post('/api/pdf/ask', async (req, res) => {
  const { question } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '缺少OPENAI_API_KEY' });
  if (!question) return res.status(400).json({ error: '缺少问题' });
  const openai = new OpenAI({ apiKey });

  const data = JSON.parse(fs.readFileSync(EMBEDDING_FILE, 'utf-8'));
  const qEmbeddingResp = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: [question],
  });
  const qEmbedding = qEmbeddingResp.data[0].embedding;
  const scored = data.map(item => ({
    chunk: item.chunk,
    score: cosineSimilarity(qEmbedding, item.embedding)
  }));
  const topChunks = scored.sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.chunk);
  const prompt = `请根据以下PDF内容片段，回答用户的问题。\n\nPDF片段：\n${topChunks.join('\n---\n')}\n\n用户问题：${question}\n\n请用简洁、专业的语言回答。`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });
  res.json({ answer: completion.choices[0].message.content });
});

app.listen(3002, () => {
  console.log('PDF智能问答API已启动，端口3002');
}); 