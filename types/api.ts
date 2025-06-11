import { OpenAI } from 'openai';

export type ModelQuality = 'fast' | 'high';

// 检查必要的环境变量
const checkRequiredEnvVars = () => {
  const required = [
    'OPENROUTER_API_KEY_FAST'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable: ${missing.join(', ')}`);
  }
};

export const MODEL_CONFIGS = {
  fast: {
    model: 'openai/gpt-4o-mini',
  },
  high: {
    model: 'openai/gpt-4o-2024-11-20',
  }
};

export const createOpenAIClient = () => {
  checkRequiredEnvVars();
  const apiKey = process.env.OPENROUTER_API_KEY_FAST;
  if (!apiKey) throw new Error('缺少OPENROUTER_API_KEY_FAST环境变量');
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
}; 