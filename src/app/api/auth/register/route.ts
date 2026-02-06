import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { formatErrorResponse, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
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
        name: parsed.data.name,
        email: parsed.data.email,
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
