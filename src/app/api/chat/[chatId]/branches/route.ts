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

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    if (!messageId) {
      return Response.json({ error: 'messageId is required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Verify chat ownership
    const chat = await db.chat.findFirst({
      where: { id: chatId, userId: session.user.id },
    });
    if (!chat) {
      return Response.json({ error: 'Chat not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Find all branches (messages with this parentId)
    const branches = await db.message.findMany({
      where: { chatId, parentId: messageId },
      orderBy: { createdAt: 'asc' },
    });

    // Also include the original message
    const original = await db.message.findUnique({
      where: { id: messageId },
    });

    return Response.json({
      original,
      branches,
      total: branches.length + 1,
    });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
