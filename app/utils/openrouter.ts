export type ModelQuality = 'fast' | 'high';

const MODEL_CONFIGS = {
  fast: {
    model: 'openai/gpt-4o-mini',
    apiKey: process.env.OPENROUTER_API_KEY_FAST,
  },
  high: {
    model: 'openai/gpt-4o-2024-11-20',
    apiKey: process.env.OPENROUTER_API_KEY_HIGH,
  }
};

export async function callOpenRouterChat({
  messages,
  quality = 'fast',
  siteUrl = 'https://maoge.pdf',
  siteTitle = 'Maoge PDF',
  apiKey: customApiKey
}: {
  messages: any[],
  quality: ModelQuality,
  siteUrl?: string,
  siteTitle?: string,
  apiKey?: string
}) {
  const { model, apiKey: envApiKey } = MODEL_CONFIGS[quality];
  // 优先用传入的apiKey，没有则用环境变量
  const apiKey = customApiKey || envApiKey;
  // debug: 打印apiKey，帮助排查环境变量问题
  console.log('[openrouter] 当前apiKey:', apiKey);
  if (!apiKey) throw new Error('缺少 openrouter key');

  // debug: 打印请求参数
  console.log('[openrouter] 请求参数:', {
    model,
    apiKey: apiKey?.slice(0, 12) + '...',
    messages,
    siteUrl,
    siteTitle
  });

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': siteTitle,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  // debug: 打印响应状态
  console.log('[openrouter] 响应状态:', res.status);

  if (!res.ok) {
    const err = await res.text();
    console.error('[openrouter] API error:', err);
    throw new Error('OpenRouter API error: ' + err);
  }
  const data = await res.json();
  // debug: 打印返回内容
  console.log('[openrouter] 返回内容:', data);
  return data.choices?.[0]?.message?.content;
} 