import { OpenAI } from 'openai';

export type ModelQuality = 'fast' | 'high';

// 检查必要的环境变量
const checkRequiredEnvVars = () => {
  const required = [
    'OPENROUTER_API_KEY_FAST',
    'OPENROUTER_API_KEY_HIGH',
    'OPENROUTER_BASE_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

export const MODEL_CONFIGS = {
  fast: {
    model: 'openai/gpt-4o-mini',
    apiKey: process.env.OPENROUTER_API_KEY_FAST,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  },
  high: {
    model: 'openai/gpt-4o-2024-11-20',
    apiKey: process.env.OPENROUTER_API_KEY_HIGH,
    baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  }
};

export const createOpenAIClient = (quality: ModelQuality) => {
  checkRequiredEnvVars();
  const config = MODEL_CONFIGS[quality];
  return new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });
}; 