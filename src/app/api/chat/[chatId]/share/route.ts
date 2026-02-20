import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    });
    if (!chat) {
      return Response.json({ error: 'Chat not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const shareId = nanoid(10);
    await db.chat.update({
      where: { id: chatId },
      data: { shareId },
    });

    return Response.json({ shareId, shareUrl: `/share/${shareId}` });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
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
    if (!session?.user?.id) throw new AuthenticationError();

    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    });
    if (!chat) {
      return Response.json({ error: 'Chat not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    await db.chat.update({
      where: { id: chatId },
      data: { shareId: null },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
