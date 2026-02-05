import Anthropic from '@anthropic-ai/sdk';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  StreamChunk,
  ChatMessage,
} from '../types';
import { getModelById, calculateCost } from '../types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function formatMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
  // Filter out system messages (handled separately in Anthropic API)
  return messages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
}

function getSystemPrompt(messages: ChatMessage[]): string | undefined {
  const systemMessage = messages.find((msg) => msg.role === 'system');
  return systemMessage?.content;
}

export async function createChatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const model = getModelById(request.model);
  if (!model || model.provider !== 'anthropic') {
    throw new Error(`Invalid Anthropic model: ${request.model}`);
  }

  const systemPrompt = getSystemPrompt(request.messages);
  const messages = formatMessages(request.messages);

  const response = await anthropic.messages.create({
    model: request.model,
    messages,
    system: systemPrompt,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 4096,
  });

  const content =
    response.content[0].type === 'text' ? response.content[0].text : '';

  const cost = calculateCost(
    model,
    response.usage.input_tokens,
    response.usage.output_tokens
  );

  return {
    id: response.id,
    model: response.model,
    content,
    finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
    cost,
  };
}

export async function* createChatCompletionStream(
  request: ChatCompletionRequest
): AsyncGenerator<StreamChunk> {
  const model = getModelById(request.model);
  if (!model || model.provider !== 'anthropic') {
    throw new Error(`Invalid Anthropic model: ${request.model}`);
  }

  const systemPrompt = getSystemPrompt(request.messages);
  const messages = formatMessages(request.messages);

  const stream = await anthropic.messages.stream({
    model: request.model,
    messages,
    system: systemPrompt,
    temperature: request.temperature ?? 0.7,
    max_tokens: request.maxTokens ?? 4096,
  });

  let id = '';

  for await (const event of stream) {
    if (event.type === 'message_start') {
      id = event.message.id;
    }

    if (event.type === 'content_block_delta') {
      if (event.delta.type === 'text_delta') {
        yield {
          id,
          content: event.delta.text,
          isComplete: false,
        };
      }
    }

    if (event.type === 'message_stop') {
      yield {
        id,
        content: '',
        isComplete: true,
        finishReason: 'stop',
      };
    }
  }
}
