import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth/tokens';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Missing token', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const email = await verifyToken(token, 'reset');

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    logger.info('auth.password_reset', { email });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('auth.reset_password_error', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json(
      { error: 'Reset failed', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
