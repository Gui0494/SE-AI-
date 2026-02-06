import Groq from 'groq-sdk';
import { AIRequestOptions, AIResponse, StreamChunk, ChatMessage, Tool } from '../types';
import { AIProviderError } from '../../errors';

let _client: Groq | null = null;
function getClient(): Groq {
  if (!_client) {
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatMessages(messages: ChatMessage[]): any[] {
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
    return {
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTools(tools: Tool[]): any[] {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
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
      toolCalls: choice.message.tool_calls?.map((tc) => ({
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
      throw new AIProviderError('Groq rate limit exceeded', 'groq', 429, true);
    }
    throw new AIProviderError(
      err.message || 'Groq request failed',
      'groq',
      err.status || 500,
      err.status === 500
    );
  }
}

export async function* stream(options: AIRequestOptions): AsyncGenerator<StreamChunk> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      model: options.model,
      messages: formatMessages(options.messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
    };
    if (options.tools?.length) {
      params.tools = formatTools(options.tools);
    }

    const response: any = await getClient().chat.completions.create(params);
    const toolCallBuffers: Record<number, { id: string; name: string; args: string }> = {};

    let emittedDone = false;

    for await (const chunk of response) {
      const c = chunk as any;
      const delta = c.choices?.[0]?.delta;
      const finishReason = c.choices?.[0]?.finish_reason;

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

      // Emit tool calls when finish_reason signals completion or x_groq usage arrives
      if (finishReason === 'tool_calls' || finishReason === 'stop' || c.x_groq?.usage) {
        // Emit buffered tool calls
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
        // Clear after emitting
        for (const key of Object.keys(toolCallBuffers)) {
          delete toolCallBuffers[Number(key)];
        }
      }

      if (c.x_groq?.usage && !emittedDone) {
        emittedDone = true;
        yield {
          type: 'done',
          usage: {
            promptTokens: c.x_groq.usage.prompt_tokens,
            completionTokens: c.x_groq.usage.completion_tokens,
            totalTokens: c.x_groq.usage.total_tokens,
          },
        };
      }
    }

    // Fallback: if x_groq.usage never arrived, emit done without usage
    if (!emittedDone) {
      yield { type: 'done' };
    }
  } catch (error: unknown) {
    const err = error as { message?: string };
    yield { type: 'error', error: err.message || 'Groq streaming failed' };
  }
}
