import { getModel } from './models';
import { AIRequestOptions, AIResponse, StreamChunk, Tool, ChatMessage } from './types';
import { AIProviderError } from '../errors';
import * as openai from './providers/openai';
import * as anthropic from './providers/anthropic';
import * as google from './providers/google';
import * as groq from './providers/groq';
import { getToolByName } from './tools';

const MAX_TOOL_ITERATIONS = 10;

type Provider = {
  complete: (options: AIRequestOptions) => Promise<AIResponse>;
  stream: (options: AIRequestOptions) => AsyncGenerator<StreamChunk>;
};

function getProvider(providerName: string): Provider {
  switch (providerName) {
    case 'openai':
      return openai;
    case 'anthropic':
      return anthropic;
    case 'google':
      return google;
    case 'groq':
      return groq;
    default:
      throw new AIProviderError(`Unknown provider: ${providerName}`, providerName, 400);
  }
}

/**
 * Non-streaming completion with automatic tool execution loop.
 */
export async function complete(options: AIRequestOptions): Promise<AIResponse> {
  const model = getModel(options.model);
  if (!model) {
    throw new AIProviderError(`Unknown model: ${options.model}`, 'unknown', 400);
  }

  const provider = getProvider(model.provider);
  let response = await provider.complete(options);
  let totalUsage = response.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  // Tool execution loop
  let iterations = 0;
  while (response.toolCalls?.length && iterations < MAX_TOOL_ITERATIONS) {
    iterations++;
    const toolResults = await executeToolCalls(response.toolCalls, options.tools || []);

    // Add assistant message with tool calls and tool results to messages
    const updatedMessages: ChatMessage[] = [
      ...options.messages,
      {
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      },
      ...toolResults.map((tr) => ({
        role: 'tool' as const,
        content: tr.content,
        toolCallId: tr.toolCallId,
      })),
    ];

    response = await provider.complete({ ...options, messages: updatedMessages });

    if (response.usage) {
      totalUsage.promptTokens += response.usage.promptTokens;
      totalUsage.completionTokens += response.usage.completionTokens;
      totalUsage.totalTokens += response.usage.totalTokens;
    }
  }

  return { ...response, usage: totalUsage };
}

/**
 * Streaming completion with tool execution.
 * Yields text chunks, tool calls, tool results, and done events.
 */
export async function* stream(options: AIRequestOptions): AsyncGenerator<StreamChunk> {
  const model = getModel(options.model);
  if (!model) {
    yield { type: 'error', error: `Unknown model: ${options.model}` };
    return;
  }

  const provider = getProvider(model.provider);
  let messages = [...options.messages];
  let iterations = 0;

  while (iterations <= MAX_TOOL_ITERATIONS) {
    let content = '';
    const toolCalls: StreamChunk['toolCall'][] = [];
    let usage: StreamChunk['usage'];

    const gen = provider.stream({ ...options, messages });

    for await (const chunk of gen) {
      if (chunk.type === 'text') {
        content += chunk.content;
        yield chunk;
      } else if (chunk.type === 'tool_call' && chunk.toolCall) {
        toolCalls.push(chunk.toolCall);
        yield chunk;
      } else if (chunk.type === 'done') {
        usage = chunk.usage;
      } else if (chunk.type === 'error') {
        yield chunk;
        return;
      }
    }

    // If no tool calls, we're done
    if (toolCalls.length === 0) {
      yield { type: 'done', usage };
      return;
    }

    // Execute tools and continue the loop
    iterations++;
    if (iterations > MAX_TOOL_ITERATIONS) {
      yield { type: 'done', usage };
      return;
    }

    // Add assistant message and execute tools
    messages = [
      ...messages,
      {
        role: 'assistant',
        content,
        toolCalls: toolCalls.filter(Boolean).map((tc) => tc!),
      },
    ];

    for (const tc of toolCalls) {
      if (!tc) continue;
      const tool = options.tools?.find((t) => t.name === tc.function.name);
      if (!tool) {
        const result = `Tool "${tc.function.name}" not found.`;
        yield { type: 'tool_result', toolResult: { toolCallId: tc.id, content: result, isError: true } };
        messages.push({ role: 'tool', content: result, toolCallId: tc.id });
        continue;
      }

      try {
        const args = JSON.parse(tc.function.arguments);
        const result = await tool.execute(args);
        yield { type: 'tool_result', toolResult: { toolCallId: tc.id, content: result } };
        messages.push({ role: 'tool', content: result, toolCallId: tc.id });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Tool execution failed';
        yield { type: 'tool_result', toolResult: { toolCallId: tc.id, content: errMsg, isError: true } };
        messages.push({ role: 'tool', content: errMsg, toolCallId: tc.id });
      }
    }
  }
}

async function executeToolCalls(
  toolCalls: NonNullable<AIResponse['toolCalls']>,
  tools: Tool[]
): Promise<{ toolCallId: string; content: string }[]> {
  const results: { toolCallId: string; content: string }[] = [];

  for (const tc of toolCalls) {
    const tool = tools.find((t) => t.name === tc.function.name) || getToolByName(tc.function.name);
    if (!tool) {
      results.push({ toolCallId: tc.id, content: `Tool "${tc.function.name}" not found.` });
      continue;
    }
    try {
      const args = JSON.parse(tc.function.arguments);
      const result = await tool.execute(args);
      results.push({ toolCallId: tc.id, content: result });
    } catch (error) {
      results.push({
        toolCallId: tc.id,
        content: error instanceof Error ? error.message : 'Tool execution failed',
      });
    }
  }

  return results;
}
