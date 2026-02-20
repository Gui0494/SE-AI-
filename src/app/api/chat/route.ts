import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const chats = await db.chat.findMany({
      where: { userId: session.user.id, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        model: true,
        style: true,
        updatedAt: true,
        createdAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(chats);
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return NextResponse.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
