import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { editMessageSchema } from '@/lib/validations';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';
import { stream as aiStream } from '@/lib/ai/router';
import { getModel, calculateCost } from '@/lib/ai/models';
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
    const parsed = editMessageSchema.safeParse(body);
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

    const targetMsg = chat.messages.find((m) => m.id === parsed.data.messageId);
    if (!targetMsg || targetMsg.role !== 'user') {
      return Response.json({ error: 'Can only edit user messages', code: 'INVALID_MESSAGE' }, { status: 400 });
    }

    // Get messages before the edited message
    const targetIdx = chat.messages.indexOf(targetMsg);
    const priorMessages = chat.messages.slice(0, targetIdx);

    // Create new user message as branch
    const newUserMsg = await db.message.create({
      data: {
        chatId,
        role: 'user',
        content: parsed.data.newContent,
        parentId: parsed.data.messageId,
      },
    });

    const subscription = await db.subscription.findUnique({ where: { userId: session.user.id } });
    const plan = subscription?.plan || 'FREE';
    const modelId = chat.model;
    const modelInfo = getModel(modelId);
    if (!modelInfo) {
      return Response.json({ error: 'Unknown model', code: 'INVALID_MODEL' }, { status: 400 });
    }

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
    }));
    historyMessages.push({ role: 'user', content: parsed.data.newContent });

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

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = '';
        let totalUsage: StreamChunk['usage'];

        try {
          // Send the new user message info first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'edit', userMessage: { id: newUserMsg.id, content: parsed.data.newContent, parentId: parsed.data.messageId } })}\n\n`)
          );

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

          const cost = totalUsage
            ? calculateCost(modelId, totalUsage.promptTokens, totalUsage.completionTokens)
            : null;

          const newAssistantMsg = await db.message.create({
            data: {
              chatId,
              role: 'assistant',
              content: fullContent,
              model: modelId,
              cost,
              tokensIn: totalUsage?.promptTokens,
              tokensOut: totalUsage?.completionTokens,
            },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'branch', messageId: newAssistantMsg.id })}\n\n`)
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
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Edit failed' })}\n\n`)
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
