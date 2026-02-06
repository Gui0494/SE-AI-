import { AIModel } from './types';

export const AI_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    contextWindow: 1048576,
    maxOutput: 32768,
    inputPrice: 2.0,
    outputPrice: 8.0,
    supportsVision: true,
    supportsTools: true,
    tier: 'pro',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    contextWindow: 1048576,
    maxOutput: 32768,
    inputPrice: 0.4,
    outputPrice: 1.6,
    supportsVision: true,
    supportsTools: true,
    tier: 'free',
  },
  {
    id: 'gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'openai',
    contextWindow: 1048576,
    maxOutput: 32768,
    inputPrice: 0.1,
    outputPrice: 0.4,
    supportsVision: true,
    supportsTools: true,
    tier: 'free',
  },
  {
    id: 'o3-mini',
    name: 'O3 Mini',
    provider: 'openai',
    contextWindow: 200000,
    maxOutput: 100000,
    inputPrice: 1.1,
    outputPrice: 4.4,
    supportsVision: false,
    supportsTools: true,
    tier: 'pro',
  },

  // Anthropic Models
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 16384,
    inputPrice: 3.0,
    outputPrice: 15.0,
    supportsVision: true,
    supportsTools: true,
    tier: 'pro',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 8192,
    inputPrice: 0.8,
    outputPrice: 4.0,
    supportsVision: true,
    supportsTools: true,
    tier: 'free',
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutput: 16384,
    inputPrice: 15.0,
    outputPrice: 75.0,
    supportsVision: true,
    supportsTools: true,
    tier: 'enterprise',
  },

  // Google Models
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    contextWindow: 1048576,
    maxOutput: 65536,
    inputPrice: 1.25,
    outputPrice: 10.0,
    supportsVision: true,
    supportsTools: true,
    tier: 'pro',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    contextWindow: 1048576,
    maxOutput: 65536,
    inputPrice: 0.15,
    outputPrice: 0.6,
    supportsVision: true,
    supportsTools: true,
    tier: 'free',
  },

  // Groq Models (fast inference)
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    contextWindow: 131072,
    maxOutput: 32768,
    inputPrice: 0.59,
    outputPrice: 0.79,
    supportsVision: false,
    supportsTools: true,
    tier: 'free',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'groq',
    contextWindow: 131072,
    maxOutput: 8192,
    inputPrice: 0.05,
    outputPrice: 0.08,
    supportsVision: false,
    supportsTools: true,
    tier: 'free',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 70B',
    provider: 'groq',
    contextWindow: 131072,
    maxOutput: 16384,
    inputPrice: 0.75,
    outputPrice: 0.99,
    supportsVision: false,
    supportsTools: false,
    tier: 'free',
  },
];

export function getModel(modelId: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}

export function getModelsByProvider(provider: string): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export function getModelsByTier(tier: 'free' | 'pro' | 'enterprise'): AIModel[] {
  const tierOrder = { free: 0, pro: 1, enterprise: 2 };
  return AI_MODELS.filter((m) => tierOrder[m.tier] <= tierOrder[tier]);
}

export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const model = getModel(modelId);
  if (!model) return 0;
  const inputCost = (promptTokens / 1_000_000) * model.inputPrice;
  const outputCost = (completionTokens / 1_000_000) * model.outputPrice;
  return Number((inputCost + outputCost).toFixed(6));
}
