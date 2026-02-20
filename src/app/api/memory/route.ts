import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';
import { upsertMemorySchema, deleteMemorySchema } from '@/lib/validations';
import { getMemories, upsertMemory, deleteMemory } from '@/lib/memory';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    const memories = await getMemories(session.user.id);
    return Response.json(memories);
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    const body = await request.json();
    const parsed = upsertMemorySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const memory = await upsertMemory(
      session.user.id,
      parsed.data.key,
      parsed.data.value,
      parsed.data.category
    );
    return Response.json(memory);
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    const body = await request.json();
    const parsed = deleteMemorySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    await deleteMemory(session.user.id, parsed.data.memoryId);
    return new Response(null, { status: 204 });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
