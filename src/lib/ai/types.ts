// AI Provider Types and Interfaces

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  maxTokens: number;
  inputCost: number;  // per 1M tokens
  outputCost: number; // per 1M tokens
  isPro: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'image' | 'file' | 'code';
  url?: string;
  data?: string;
  mimeType?: string;
  name?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
  webSearch?: boolean;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'tool_calls';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
}

export interface StreamChunk {
  id: string;
  content: string;
  isComplete: boolean;
  finishReason?: string;
}

// Available models configuration
export const AI_MODELS: AIModel[] = [
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    maxTokens: 128000,
    inputCost: 5.0,
    outputCost: 15.0,
    isPro: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    maxTokens: 128000,
    inputCost: 10.0,
    outputCost: 30.0,
    isPro: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 16385,
    inputCost: 0.5,
    outputCost: 1.5,
    isPro: false,
    supportsVision: false,
    supportsTools: true,
  },

  // Anthropic
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    maxTokens: 200000,
    inputCost: 15.0,
    outputCost: 75.0,
    isPro: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    maxTokens: 200000,
    inputCost: 3.0,
    outputCost: 15.0,
    isPro: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    maxTokens: 200000,
    inputCost: 0.25,
    outputCost: 1.25,
    isPro: false,
    supportsVision: true,
    supportsTools: true,
  },

  // Google
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    maxTokens: 1000000,
    inputCost: 3.5,
    outputCost: 10.5,
    isPro: true,
    supportsVision: true,
    supportsTools: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    maxTokens: 1000000,
    inputCost: 0.075,
    outputCost: 0.3,
    isPro: false,
    supportsVision: true,
    supportsTools: true,
  },

  // Groq (fast inference)
  {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B',
    provider: 'groq',
    maxTokens: 32768,
    inputCost: 0.59,
    outputCost: 0.79,
    isPro: false,
    supportsVision: false,
    supportsTools: true,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    maxTokens: 32768,
    inputCost: 0.24,
    outputCost: 0.24,
    isPro: false,
    supportsVision: false,
    supportsTools: true,
  },
];

export function getModelById(modelId: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === modelId);
}

export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS.filter((m) => m.provider === provider);
}

export function getFreeModels(): AIModel[] {
  return AI_MODELS.filter((m) => !m.isPro);
}

export function getProModels(): AIModel[] {
  return AI_MODELS.filter((m) => m.isPro);
}

export function calculateCost(
  model: AIModel,
  promptTokens: number,
  completionTokens: number
): number {
  const inputCost = (promptTokens / 1_000_000) * model.inputCost;
  const outputCost = (completionTokens / 1_000_000) * model.outputCost;
  return inputCost + outputCost;
}
