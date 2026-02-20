import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createToken } from '@/lib/auth/tokens';
import { sendEmail, buildPasswordResetEmail } from '@/lib/email';
import { checkAuthRateLimit } from '@/lib/rate-limit/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkAuthRateLimit(ip, 'login');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }

    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: 'If an account exists with that email, a reset link has been sent.',
    });

    const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.password) {
      // Don't reveal whether the account exists
      return successResponse;
    }

    const token = await createToken(user.email!, 'reset');
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const { subject, html, text } = buildPasswordResetEmail(resetUrl);
    await sendEmail({ to: user.email!, subject, html, text });

    logger.info('auth.password_reset_requested', { email: user.email });

    return successResponse;
  } catch (error) {
    logger.error('auth.forgot_password_error', { error: error instanceof Error ? error.message : 'Unknown' });
    return NextResponse.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
