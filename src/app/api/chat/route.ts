import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { message, model = 'gpt-4o' } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem e obrigatoria' },
        { status: 400 }
      );
    }

    // Generate title from first message (truncated)
    const title = message.length > 50 ? message.substring(0, 50) + '...' : message;

    // Create chat
    const chat = await db.chat.create({
      data: {
        userId: session.user.id,
        title,
        model,
      },
    });

    // Create initial user message
    await db.message.create({
      data: {
        chatId: chat.id,
        userId: session.user.id,
        role: 'user',
        content: message,
      },
    });

    return NextResponse.json({ chatId: chat.id });
  } catch (error) {
    console.error('Chat creation error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const chats = await db.chat.findMany({
      where: {
        userId: session.user.id,
        isArchived: false,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
          },
        },
      },
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Chat list error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
