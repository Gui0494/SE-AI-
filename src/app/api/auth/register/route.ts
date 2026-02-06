import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { formatErrorResponse, ValidationError } from '@/lib/errors';
import { checkAuthRateLimit } from '@/lib/rate-limit/auth';
import { sanitizeShortText } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkAuthRateLimit(ip, 'register');
    if (!rateCheck.allowed) {
      const retryAfter = Math.ceil(rateCheck.retryAfterMs / 1000);
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.', code: 'RATE_LIMIT' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const fields: Record<string, string> = {};
      for (const [key, val] of Object.entries(fieldErrors)) {
        if (val) fields[key] = val.join(', ');
      }
      throw new ValidationError('Invalid input', fields);
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      throw new ValidationError('User already exists', {
        email: 'An account with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        name: sanitizeShortText(parsed.data.name),
        email: parsed.data.email.trim().toLowerCase(),
        password: hashedPassword,
      },
    });

    // Create FREE subscription
    await db.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE',
        messagesLimit: 20,
      },
    });

    return NextResponse.json(
      { message: 'Account created successfully' },
      { status: 201 }
    );
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return NextResponse.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
