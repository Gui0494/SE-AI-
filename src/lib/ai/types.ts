export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxOutput: number;
  inputPrice: number;   // per 1M tokens in USD
  outputPrice: number;  // per 1M tokens in USD
  supportsVision: boolean;
  supportsTools: boolean;
  tier: 'free' | 'pro' | 'enterprise';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  attachments?: Attachment[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface Attachment {
  type: 'image' | 'file';
  url: string;
  name: string;
  mimeType: string;
  size?: number;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export interface AIRequestOptions {
  model: string;
  messages: ChatMessage[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  usage?: AIResponse['usage'];
  error?: string;
}

export interface SystemPromptConfig {
  style: string;
  context?: string;
  memories?: string[];
  tools?: string[];
}
