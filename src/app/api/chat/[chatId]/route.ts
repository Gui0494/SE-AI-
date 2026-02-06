import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendMessageSchema } from '@/lib/validations';
import { formatErrorResponse, AuthenticationError, InsufficientPlanError } from '@/lib/errors';
import { stream as aiStream } from '@/lib/ai/router';
import { getModel, calculateCost, getModelsByTier } from '@/lib/ai/models';
import { manageContext } from '@/lib/ai/context-manager';
import { buildSystemPrompt } from '@/lib/ai/system-prompts';
import { getToolsForPlan } from '@/lib/ai/tools';
import { enforceRateLimit, incrementRateLimit } from '@/lib/rate-limit';
import { ChatMessage, StreamChunk } from '@/lib/ai/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', code: 'VALIDATION_ERROR' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get chat and verify ownership
    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });

    if (!chat) {
      return new Response(
        JSON.stringify({ error: 'Chat not found', code: 'NOT_FOUND' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get subscription and check plan
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });
    const plan = subscription?.plan || 'FREE';

    // Check model access
    const modelId = parsed.data.model || chat.model;
    const modelInfo = getModel(modelId);
    if (!modelInfo) {
      return new Response(
        JSON.stringify({ error: 'Unknown model', code: 'INVALID_MODEL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify plan allows this model
    const allowedModels = getModelsByTier(plan.toLowerCase() as 'free' | 'pro' | 'enterprise');
    if (!allowedModels.find((m) => m.id === modelId)) {
      throw new InsufficientPlanError(modelInfo.tier.toUpperCase(), plan);
    }

    // Rate limiting
    const rateResult = enforceRateLimit(session.user.id, plan);

    // Save user message
    await db.message.create({
      data: {
        chatId,
        role: 'user',
        content: parsed.data.content,
        attachments: parsed.data.attachments ? JSON.parse(JSON.stringify(parsed.data.attachments)) : undefined,
      },
    });

    // Update chat title if it's the first message
    const messageCount = chat.messages.length;
    if (messageCount === 0) {
      const title =
        parsed.data.content.length > 50
          ? parsed.data.content.substring(0, 50) + '...'
          : parsed.data.content;
      await db.chat.update({ where: { id: chatId }, data: { title } });
    }

    // Build messages for AI
    const historyMessages: ChatMessage[] = chat.messages.map((m) => ({
      role: m.role as ChatMessage['role'],
      content: m.content,
      toolCalls: m.toolCalls as unknown as ChatMessage['toolCalls'],
      attachments: m.attachments as unknown as ChatMessage['attachments'],
    }));

    // Add current user message
    historyMessages.push({
      role: 'user',
      content: parsed.data.content,
      attachments: parsed.data.attachments,
    });

    // Build system prompt
    const tools = getToolsForPlan(plan);
    const systemPrompt = buildSystemPrompt({
      style: parsed.data.style || chat.style,
      context: chat.summary || undefined,
      tools: tools.map((t) => t.name),
    });

    // Add system prompt
    const allMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
    ];

    // Manage context window
    const managed = manageContext(allMessages, {
      maxContextTokens: modelInfo.contextWindow,
      reserveTokens: modelInfo.maxOutput,
      maxRecentMessages: 40,
      summary: chat.summary,
    });

    // Increment rate limit counter
    incrementRateLimit(session.user.id, plan);

    // Stream response via SSE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let totalUsage: StreamChunk['usage'];
        const allToolCalls: StreamChunk['toolCall'][] = [];

        try {
          const gen = aiStream({
            model: modelId,
            messages: managed.messages,
            tools: modelInfo.supportsTools ? tools : undefined,
            temperature: 0.7,
            maxTokens: modelInfo.maxOutput,
          });

          for await (const chunk of gen) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            if (chunk.type === 'text' && chunk.content) {
              fullContent += chunk.content;
            }
            if (chunk.type === 'tool_call' && chunk.toolCall) {
              allToolCalls.push(chunk.toolCall);
            }
            if (chunk.type === 'done') {
              totalUsage = chunk.usage;
            }
          }

          // Save assistant message
          const cost = totalUsage
            ? calculateCost(modelId, totalUsage.promptTokens, totalUsage.completionTokens)
            : null;

          await db.message.create({
            data: {
              chatId,
              role: 'assistant',
              content: fullContent,
              model: modelId,
              cost,
              tokensIn: totalUsage?.promptTokens,
              tokensOut: totalUsage?.completionTokens,
              toolCalls: allToolCalls.length > 0 ? JSON.parse(JSON.stringify(allToolCalls)) : undefined,
            },
          });

          // Update cost tracking
          if (cost && subscription) {
            await db.subscription.update({
              where: { id: subscription.id },
              data: {
                tokensUsed: { increment: totalUsage?.totalTokens || 0 },
                totalCost: { increment: cost },
                messagesUsed: { increment: 1 },
              },
            });
          }

          // Update chat timestamp
          await db.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
          });
        } catch (error) {
          const errMsg =
            error instanceof Error ? error.message : 'Streaming failed';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-RateLimit-Remaining': String(rateResult.remaining - 1),
        'X-RateLimit-Reset': String(rateResult.resetAt),
        'X-RateLimit-Limit': String(rateResult.limit),
      },
    });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return new Response(
      JSON.stringify({ error: formatted.error, code: formatted.code }),
      {
        status: formatted.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!chat) {
      return new Response(
        JSON.stringify({ error: 'Chat not found', code: 'NOT_FOUND' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(chat), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return new Response(
      JSON.stringify({ error: formatted.error, code: formatted.code }),
      {
        status: formatted.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    });

    if (!chat) {
      return new Response(
        JSON.stringify({ error: 'Chat not found', code: 'NOT_FOUND' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.chat.delete({ where: { id: chatId } });

    return new Response(null, { status: 204 });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return new Response(
      JSON.stringify({ error: formatted.error, code: formatted.code }),
      {
        status: formatted.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
