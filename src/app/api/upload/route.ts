import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';
import { uploadRequestSchema } from '@/lib/validations';
import { isAllowedType, getMaxSize, sanitizeFilename, getUploadUrl } from '@/lib/storage';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    const body = await request.json();
    const parsed = uploadRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { filename, contentType, size } = parsed.data;

    // Validate content type
    if (!isAllowedType(contentType)) {
      return Response.json(
        { error: 'File type not allowed', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Get plan and check size limits
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });
    const plan = subscription?.plan || 'FREE';
    const maxSize = getMaxSize(plan);

    if (size > maxSize) {
      return Response.json(
        {
          error: `File too large. Max ${Math.round(maxSize / (1024 * 1024))}MB for ${plan} plan.`,
          code: 'FILE_TOO_LARGE',
        },
        { status: 400 }
      );
    }

    // Generate key
    const ext = filename.split('.').pop() || '';
    const safeName = sanitizeFilename(filename);
    const key = `uploads/${session.user.id}/${randomUUID()}.${ext}`;

    const { uploadUrl, publicUrl } = await getUploadUrl(key, contentType, size);

    return Response.json({ uploadUrl, publicUrl, key });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return Response.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
