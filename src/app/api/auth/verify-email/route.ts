import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/tokens';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Missing token', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  try {
    const email = await verifyToken(token, 'verification');

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired verification link', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    // Mark user email as verified
    await db.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    logger.info('auth.email_verified', { email });

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('auth.verify_email_error', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json(
      { error: 'Verification failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
