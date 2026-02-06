import Anthropic from '@anthropic-ai/sdk';
import { AIRequestOptions, AIResponse, StreamChunk, ChatMessage, Tool } from '../types';
import { AIProviderError } from '../../errors';

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

function extractSystemPrompt(messages: ChatMessage[]): string {
  const systemMsgs = messages.filter((m) => m.role === 'system');
  return systemMsgs.map((m) => m.content).join('\n\n');
}

function formatMessages(
  messages: ChatMessage[]
): Anthropic.MessageParam[] {
  return messages
    .filter((m) => m.role !== 'system')
    .map((msg) => {
      if (msg.role === 'user' && msg.attachments?.length) {
        const content: Anthropic.ContentBlockParam[] = [
          ...msg.attachments
            .filter((a) => a.type === 'image')
            .map((a) => ({
              type: 'image' as const,
              source: {
                type: 'url' as const,
                url: a.url,
              },
            })),
          { type: 'text' as const, text: msg.content },
        ];
        return { role: 'user' as const, content };
      }
      if (msg.role === 'assistant' && msg.toolCalls?.length) {
        const content: Anthropic.ContentBlockParam[] = [];
        if (msg.content) {
          content.push({ type: 'text' as const, text: msg.content });
        }
        for (const tc of msg.toolCalls) {
          content.push({
            type: 'tool_use' as const,
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          });
        }
        return { role: 'assistant' as const, content };
      }
      if (msg.role === 'tool') {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'tool_result' as const,
              tool_use_id: msg.toolCallId || '',
              content: msg.content,
            },
          ],
        };
      }
      return {
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content,
      };
    });
}

function formatTools(tools: Tool[]): Anthropic.Tool[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters as Anthropic.Tool.InputSchema,
  }));
}

export async function complete(options: AIRequestOptions): Promise<AIResponse> {
  try {
    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: options.model,
      max_tokens: options.maxTokens || 4096,
      messages: formatMessages(options.messages),
      system: extractSystemPrompt(options.messages) || undefined,
      temperature: options.temperature ?? 0.7,
    };
    if (options.tools?.length) {
      params.tools = formatTools(options.tools);
    }

    const response = await getClient().messages.create(params);

    let content = '';
    const toolCalls: AIResponse['toolCalls'] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason || undefined,
    };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 429) {
      throw new AIProviderError('Anthropic rate limit exceeded', 'anthropic', 429, true);
    }
    throw new AIProviderError(
      err.message || 'Anthropic request failed',
      'anthropic',
      err.status || 500,
      err.status === 500
    );
  }
}

export async function* stream(options: AIRequestOptions): AsyncGenerator<StreamChunk> {
  try {
    const params: Anthropic.MessageCreateParamsStreaming = {
      model: options.model,
      max_tokens: options.maxTokens || 4096,
      messages: formatMessages(options.messages),
      system: extractSystemPrompt(options.messages) || undefined,
      temperature: options.temperature ?? 0.7,
      stream: true,
    };
    if (options.tools?.length) {
      params.tools = formatTools(options.tools);
    }

    const response = await getClient().messages.create(params);
    let currentToolId = '';
    let currentToolName = '';
    let currentToolArgs = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of response) {
      if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens;
      } else if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          currentToolId = event.content_block.id;
          currentToolName = event.content_block.name;
          currentToolArgs = '';
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text', content: event.delta.text };
        } else if (event.delta.type === 'input_json_delta') {
          currentToolArgs += event.delta.partial_json;
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolId) {
          yield {
            type: 'tool_call',
            toolCall: {
              id: currentToolId,
              type: 'function',
              function: { name: currentToolName, arguments: currentToolArgs },
            },
          };
          currentToolId = '';
        }
      } else if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens;
      } else if (event.type === 'message_stop') {
        yield {
          type: 'done',
          usage: {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
        };
      }
    }
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    yield { type: 'error', error: err.message || 'Anthropic streaming failed' };
  }
}
