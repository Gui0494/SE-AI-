import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { regenerateSchema } from '@/lib/validations';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';
import { stream as aiStream } from '@/lib/ai/router';
import { getModel, calculateCost, getModelsByTier } from '@/lib/ai/models';
import { manageContext } from '@/lib/ai/context-manager';
import { buildSystemPrompt } from '@/lib/ai/system-prompts';
import { getToolsForPlan } from '@/lib/ai/tools';
import { getMemories, formatMemoriesForPrompt } from '@/lib/memory';
import { ChatMessage, StreamChunk } from '@/lib/ai/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    const body = await request.json();
    const parsed = regenerateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!chat) {
      return Response.json({ error: 'Chat not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Find the assistant message to regenerate
    const targetMsg = chat.messages.find((m) => m.id === parsed.data.messageId);
    if (!targetMsg || targetMsg.role !== 'assistant') {
      return Response.json({ error: 'Invalid message for regeneration', code: 'INVALID_MESSAGE' }, { status: 400 });
    }

    // Find messages up to (but not including) the target assistant message
    const targetIdx = chat.messages.indexOf(targetMsg);
    const priorMessages = chat.messages.slice(0, targetIdx);

    const subscription = await db.subscription.findUnique({ where: { userId: session.user.id } });
    const plan = subscription?.plan || 'FREE';

    const modelId = targetMsg.model || chat.model;
    const modelInfo = getModel(modelId);
    if (!modelInfo) {
      return Response.json({ error: 'Unknown model', code: 'INVALID_MODEL' }, { status: 400 });
    }

    // Build context
    const memories = await getMemories(session.user.id);
    const memoryStrings = formatMemoriesForPrompt(memories);
    const tools = getToolsForPlan(plan);
    const systemPrompt = buildSystemPrompt({
      style: chat.style,
      context: chat.summary || undefined,
      memories: memoryStrings,
      tools: tools.map((t) => t.name),
    });

    const historyMessages: ChatMessage[] = priorMessages.map((m) => ({
      role: m.role as ChatMessage['role'],
      content: m.content,
      toolCalls: m.toolCalls as unknown as ChatMessage['toolCalls'],
      attachments: m.attachments as unknown as ChatMessage['attachments'],
    }));

    const allMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
    ];

    const managed = manageContext(allMessages, {
      maxContextTokens: modelInfo.contextWindow,
      reserveTokens: modelInfo.maxOutput,
      maxRecentMessages: 40,
      summary: chat.summary,
    });

    // Create the new branch message (with parentId pointing to original)
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let totalUsage: StreamChunk['usage'];

        try {
          const gen = aiStream({
            model: modelId,
            messages: managed.messages,
            tools: modelInfo.supportsTools ? tools : undefined,
            temperature: 0.7,
            maxTokens: modelInfo.maxOutput,
          });

          for await (const chunk of gen) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            if (chunk.type === 'text' && chunk.content) fullContent += chunk.content;
            if (chunk.type === 'done') totalUsage = chunk.usage;
          }

          // Save as branch (parentId = original message)
          const cost = totalUsage
            ? calculateCost(modelId, totalUsage.promptTokens, totalUsage.completionTokens)
            : null;

          const newMsg = await db.message.create({
            data: {
              chatId,
              role: 'assistant',
              content: fullContent,
              model: modelId,
              cost,
              tokensIn: totalUsage?.promptTokens,
              tokensOut: totalUsage?.completionTokens,
              parentId: parsed.data.messageId,
            },
          });

          // Send the new message id
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'branch', messageId: newMsg.id, parentId: parsed.data.messageId })}\n\n`)
          );

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
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Regeneration failed' })}\n\n`)
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
      },
    });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
