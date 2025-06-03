import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { input, modelType } = await req.json();

  const fastKey = process.env.OPENROUTER_KEY_FAST;
  const qualityKey = process.env.OPENROUTER_KEY_QUALITY;
  const model = modelType === 'fast' ? 'openai/gpt-4o-mini' : 'openai/gpt-4o-2024-11-20';
  const apiKey = modelType === 'fast' ? fastKey : qualityKey;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not set' }, { status: 500 });
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://maogepdf.com',
      'X-Title': 'MaogePDF',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'user', content: input }
      ]
    })
  });

  const data = await response.json();
  return NextResponse.json(data);
} 