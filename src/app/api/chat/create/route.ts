import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createChatSchema } from '@/lib/validations';
import { formatErrorResponse, AuthenticationError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const body = await request.json();
    const parsed = createChatSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const fields: Record<string, string> = {};
      for (const [key, val] of Object.entries(fieldErrors)) {
        if (val) fields[key] = val.join(', ');
      }
      throw new ValidationError('Invalid input', fields);
    }

    const chat = await db.chat.create({
      data: {
        userId: session.user.id,
        title: parsed.data.title || 'New Chat',
        model: parsed.data.model,
        style: parsed.data.style,
      },
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return NextResponse.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
