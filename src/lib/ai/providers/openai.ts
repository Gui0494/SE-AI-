import OpenAI from 'openai';
import { AIRequestOptions, AIResponse, StreamChunk, ChatMessage, Tool } from '../types';
import { AIProviderError } from '../../errors';

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

function formatMessages(messages: ChatMessage[]): OpenAI.ChatCompletionMessageParam[] {
  return messages.map((msg) => {
    if (msg.role === 'tool') {
      return {
        role: 'tool' as const,
        content: msg.content,
        tool_call_id: msg.toolCallId || '',
      };
    }
    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      return {
        role: 'assistant' as const,
        content: msg.content || null,
        tool_calls: msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.function.name, arguments: tc.function.arguments },
        })),
      };
    }
    if (msg.role === 'user' && msg.attachments?.length) {
      const content: OpenAI.ChatCompletionContentPart[] = [
        { type: 'text', text: msg.content },
        ...msg.attachments
          .filter((a) => a.type === 'image')
          .map((a) => ({
            type: 'image_url' as const,
            image_url: { url: a.url },
          })),
      ];
      return { role: 'user' as const, content };
    }
    return {
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    };
  });
}

function formatTools(tools: Tool[]): OpenAI.ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export async function complete(options: AIRequestOptions): Promise<AIResponse> {
  try {
    const params: OpenAI.ChatCompletionCreateParamsNonStreaming = {
      model: options.model,
      messages: formatMessages(options.messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
    };
    if (options.tools?.length) {
      params.tools = formatTools(options.tools);
    }

    const response = await getClient().chat.completions.create(params);
    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      toolCalls: choice.message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      finishReason: choice.finish_reason || undefined,
    };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 429) {
      throw new AIProviderError('OpenAI rate limit exceeded', 'openai', 429, true);
    }
    throw new AIProviderError(
      err.message || 'OpenAI request failed',
      'openai',
      err.status || 500,
      err.status === 500
    );
  }
}

export async function* stream(options: AIRequestOptions): AsyncGenerator<StreamChunk> {
  try {
    const params: OpenAI.ChatCompletionCreateParamsStreaming = {
      model: options.model,
      messages: formatMessages(options.messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
      stream_options: { include_usage: true },
    };
    if (options.tools?.length) {
      params.tools = formatTools(options.tools);
    }

    const response = await getClient().chat.completions.create(params);
    const toolCallBuffers: Record<number, { id: string; name: string; args: string }> = {};

    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        yield { type: 'text', content: delta.content };
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (tc.id) {
            toolCallBuffers[tc.index] = { id: tc.id, name: tc.function?.name || '', args: '' };
          }
          if (tc.function?.arguments) {
            toolCallBuffers[tc.index].args += tc.function.arguments;
          }
        }
      }

      if (chunk.usage) {
        // Emit tool calls before done
        for (const buf of Object.values(toolCallBuffers)) {
          yield {
            type: 'tool_call',
            toolCall: {
              id: buf.id,
              type: 'function',
              function: { name: buf.name, arguments: buf.args },
            },
          };
        }

        yield {
          type: 'done',
          usage: {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          },
        };
      }
    }
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    yield {
      type: 'error',
      error: err.message || 'OpenAI streaming failed',
    };
  }
}
