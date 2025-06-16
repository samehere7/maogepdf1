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
    model: 'deepseek/deepseek-chat-v3-0324:free',
  },
  high: {
    model: 'deepseek/deepseek-chat-v3-0324:free',
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