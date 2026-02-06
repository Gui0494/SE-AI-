import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!chat) {
      return Response.json({ error: 'Chat not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'md';

    let content: string;
    let contentType: string;
    let ext: string;

    switch (format) {
      case 'json': {
        content = JSON.stringify(
          {
            title: chat.title,
            model: chat.model,
            createdAt: chat.createdAt,
            messages: chat.messages.map((m) => ({
              role: m.role,
              content: m.content,
              model: m.model,
              createdAt: m.createdAt,
              cost: m.cost,
            })),
          },
          null,
          2
        );
        contentType = 'application/json';
        ext = 'json';
        break;
      }

      case 'txt': {
        const lines = [`${chat.title}\n${'='.repeat(chat.title.length)}\n`];
        for (const msg of chat.messages) {
          const label = msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Assistant' : msg.role;
          lines.push(`[${label}]:\n${msg.content}\n`);
        }
        content = lines.join('\n');
        contentType = 'text/plain';
        ext = 'txt';
        break;
      }

      case 'md':
      default: {
        const lines = [`# ${chat.title}\n`, `**Model:** ${chat.model}  `, `**Date:** ${new Date(chat.createdAt).toLocaleDateString()}\n`, '---\n'];
        for (const msg of chat.messages) {
          if (msg.role === 'user') {
            lines.push(`### You\n\n${msg.content}\n`);
          } else if (msg.role === 'assistant') {
            lines.push(`### Assistant${msg.model ? ` (${msg.model})` : ''}\n\n${msg.content}\n`);
          }
        }
        content = lines.join('\n');
        contentType = 'text/markdown';
        ext = 'md';
        break;
      }
    }

    const safeName = chat.title.replace(/[^a-zA-Z0-9-_ ]/g, '').substring(0, 50);
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeName}.${ext}"`,
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
