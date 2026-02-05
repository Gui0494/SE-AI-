import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { AIRouter, getSystemPrompt, type ChatMessage } from '@/lib/ai';

export const runtime = 'nodejs';

// GET - Fetch chat with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const chat = await db.chat.findUnique({
      where: {
        id: params.chatId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Chat fetch error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Send message and get AI response (streaming)
export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { message, model, style, temperature } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem e obrigatoria' },
        { status: 400 }
      );
    }

    // Verify chat exists and belongs to user
    const chat = await db.chat.findUnique({
      where: {
        id: params.chatId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50, // Last 50 messages for context
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat nao encontrado' }, { status: 404 });
    }

    // Save user message
    await db.message.create({
      data: {
        chatId: params.chatId,
        userId: session.user.id,
        role: 'user',
        content: message,
      },
    });

    // Build messages array for AI
    const systemPrompt = getSystemPrompt(style || 'default');
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chat.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';

          const aiStream = AIRouter.chatStream({
            model: model || chat.model || 'gpt-4o',
            messages: chatMessages,
            temperature: temperature ?? 0.7,
            stream: true,
          });

          for await (const chunk of aiStream) {
            fullContent += chunk.content;

            // Send SSE formatted chunk
            const data = JSON.stringify({
              content: chunk.content,
              isComplete: chunk.isComplete,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            if (chunk.isComplete) {
              // Save assistant message
              await db.message.create({
                data: {
                  chatId: params.chatId,
                  role: 'assistant',
                  content: fullContent,
                  model: model || chat.model,
                },
              });

              // Update chat
              await db.chat.update({
                where: { id: params.chatId },
                data: {
                  messageCount: { increment: 2 },
                  updatedAt: new Date(),
                },
              });
            }
          }

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({ error: 'Erro ao gerar resposta' });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat message error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    await db.chat.delete({
      where: {
        id: params.chatId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat delete error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Update chat (title, archive, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, isArchived, isPinned, model, style } = body;

    const chat = await db.chat.update({
      where: {
        id: params.chatId,
        userId: session.user.id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(isArchived !== undefined && { isArchived }),
        ...(isPinned !== undefined && { isPinned }),
        ...(model !== undefined && { model }),
        ...(style !== undefined && { style }),
      },
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Chat update error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
