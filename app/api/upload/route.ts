import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 存到 public/uploads 目录
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // 防止重名覆盖
  let fileName = file.name;
  let filePath = path.join(uploadDir, fileName);
  let count = 1;
  while (fs.existsSync(filePath)) {
    const ext = path.extname(fileName);
    const base = path.basename(fileName, ext);
    fileName = `${base}_${count}${ext}`;
    filePath = path.join(uploadDir, fileName);
    count++;
  }

  fs.writeFileSync(filePath, buffer);

  // 返回可访问的 URL
  const url = `/uploads/${encodeURIComponent(fileName)}`;
  return NextResponse.json({ url });
} 