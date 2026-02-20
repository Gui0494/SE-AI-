import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Content, Part } from '@google/generative-ai';
import { AIRequestOptions, AIResponse, StreamChunk, ChatMessage, Tool } from '../types';
import { AIProviderError } from '../../errors';

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
  }
  return _genAI;
}

function formatMessages(messages: ChatMessage[]): {
  systemInstruction: string;
  contents: Content[];
} {
  const systemMsgs = messages.filter((m) => m.role === 'system');
  const systemInstruction = systemMsgs.map((m) => m.content).join('\n\n');

  const contents: Content[] = [];
  for (const msg of messages.filter((m) => m.role !== 'system')) {
    const parts: Part[] = [];

    if (msg.role === 'tool') {
      parts.push({
        functionResponse: {
          name: msg.toolCallId || 'unknown',
          response: { result: msg.content },
        },
      });
      contents.push({ role: 'function', parts });
      continue;
    }

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    if (msg.attachments?.length) {
      for (const attachment of msg.attachments) {
        if (attachment.type === 'image') {
          if (attachment.url.startsWith('data:') || !attachment.url.startsWith('http')) {
            // Base64 data — strip data URI prefix if present
            const base64Data = attachment.url.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: attachment.mimeType,
                data: base64Data,
              },
            });
          } else {
            // URL — use fileData
            parts.push({
              fileData: {
                mimeType: attachment.mimeType,
                fileUri: attachment.url,
              },
            });
          }
        }
      }
    }

    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      for (const tc of msg.toolCalls) {
        parts.push({
          functionCall: {
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments),
          },
        });
      }
    }

    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    });
  }

  return { systemInstruction, contents };
}

function mapSchemaType(type: string): SchemaType {
  const mapping: Record<string, SchemaType> = {
    string: SchemaType.STRING,
    number: SchemaType.NUMBER,
    integer: SchemaType.INTEGER,
    boolean: SchemaType.BOOLEAN,
    array: SchemaType.ARRAY,
    object: SchemaType.OBJECT,
  };
  return mapping[type] || SchemaType.STRING;
}

function convertProperties(
  props: Record<string, Record<string, unknown>>
): Record<string, { type: SchemaType; description?: string }> {
  const result: Record<string, { type: SchemaType; description?: string }> = {};
  for (const [key, value] of Object.entries(props)) {
    result[key] = {
      type: mapSchemaType((value.type as string) || 'string'),
      description: value.description as string | undefined,
    };
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTools(tools: Tool[]): any[] {
  return [
    {
      functionDeclarations: tools.map((tool) => {
        const params = tool.parameters as Record<string, unknown>;
        return {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: SchemaType.OBJECT,
            properties: convertProperties(
              (params.properties as Record<string, Record<string, unknown>>) || {}
            ),
            required: (params.required as string[]) || [],
          },
        };
      }),
    },
  ];
}

export async function complete(options: AIRequestOptions): Promise<AIResponse> {
  try {
    const { systemInstruction, contents } = formatMessages(options.messages);
    const model = getGenAI().getGenerativeModel({
      model: options.model,
      systemInstruction: systemInstruction || undefined,
    });

    const config: Record<string, unknown> = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens,
    };

    const result = await model.generateContent({
      contents,
      generationConfig: config,
      tools: options.tools?.length ? formatTools(options.tools) : undefined,
    });

    const response = result.response;
    const text = response.text();
    const toolCalls = response.candidates?.[0]?.content?.parts
      ?.filter((p: Part) => p.functionCall)
      ?.map((p: Part, i: number) => ({
        id: `call_${i}`,
        type: 'function' as const,
        function: {
          name: p.functionCall!.name,
          arguments: JSON.stringify(p.functionCall!.args),
        },
      }));

    const usage = response.usageMetadata;

    return {
      content: text,
      toolCalls: toolCalls?.length ? toolCalls : undefined,
      usage: usage
        ? {
            promptTokens: usage.promptTokenCount || 0,
            completionTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
          }
        : undefined,
      finishReason: response.candidates?.[0]?.finishReason || undefined,
    };
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    throw new AIProviderError(
      err.message || 'Google AI request failed',
      'google',
      err.status || 500,
      err.status === 429 || err.status === 500
    );
  }
}

export async function* stream(options: AIRequestOptions): AsyncGenerator<StreamChunk> {
  try {
    const { systemInstruction, contents } = formatMessages(options.messages);
    const model = getGenAI().getGenerativeModel({
      model: options.model,
      systemInstruction: systemInstruction || undefined,
    });

    const config: Record<string, unknown> = {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens,
    };

    const result = await model.generateContentStream({
      contents,
      generationConfig: config,
      tools: options.tools?.length ? formatTools(options.tools) : undefined,
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield { type: 'text', content: text };
      }

      const parts = chunk.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.functionCall) {
            yield {
              type: 'tool_call',
              toolCall: {
                id: `call_${Date.now()}`,
                type: 'function',
                function: {
                  name: part.functionCall.name,
                  arguments: JSON.stringify(part.functionCall.args),
                },
              },
            };
          }
        }
      }
    }

    const aggregated = await result.response;
    const usage = aggregated.usageMetadata;

    yield {
      type: 'done',
      usage: usage
        ? {
            promptTokens: usage.promptTokenCount || 0,
            completionTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
          }
        : undefined,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    yield { type: 'error', error: err.message || 'Google AI streaming failed' };
  }
}
