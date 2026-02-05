import OpenAI from 'openai';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
  ChatMessage,
} from '../types';
import { getModelById, calculateCost } from '../types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

export async function createChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const model = getModelById(request.model);
  if (!model || model.provider !== 'openai') {
    throw new Error(`Invalid OpenAI model: ${request.model}`);
  }

  const response = await openai.chat.completions.create({
    model: request.model,
    messages: formatMessages(request.messages),
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 4096,
    stream: false,
  });

  const usage = response.usage!;
  const cost = calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

  return {
    id: response.id,
    model: response.model,
    content: response.choices[0].message.content || '',
    finishReason: response.choices[0].finish_reason as 'stop' | 'length' | 'tool_calls',
    usage: {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    },
    cost,
  };
}

export async function* createChatCompletionStream(
  request: ChatCompletionRequest
): AsyncGenerator<StreamChunk> {
  const model = getModelById(request.model);
  if (!model || model.provider !== 'openai') {
    throw new Error(`Invalid OpenAI model: ${request.model}`);
  }

  const stream = await openai.chat.completions.create({
    model: request.model,
    messages: formatMessages(request.messages),
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 4096,
    stream: true,
  });

  let content = '';
  let id = '';

  for await (const chunk of stream) {
    id = chunk.id;
    const delta = chunk.choices[0]?.delta?.content || '';
    content += delta;

    yield {
      id,
      content: delta,
      isComplete: false,
    };

    if (chunk.choices[0]?.finish_reason) {
      yield {
        id,
        content: '',
        isComplete: true,
        finishReason: chunk.choices[0].finish_reason,
      };
    }
  }
}

export async function createImageGeneration(
  prompt: string,
  options: {
    model?: 'dall-e-2' | 'dall-e-3';
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  } = {}
): Promise<string> {
  const response = await openai.images.generate({
    model: options.model || 'dall-e-3',
    prompt,
    n: 1,
    size: options.size || '1024x1024',
    quality: options.quality || 'standard',
    style: options.style || 'vivid',
    response_format: 'url',
  });

  return response.data[0].url!;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}
