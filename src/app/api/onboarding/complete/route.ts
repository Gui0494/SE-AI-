import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { interests = [], experienceLevel = 'intermediate', skipped = false } = body;

    // Update user
    await db.user.update({
      where: { id: session.user.id },
      data: {
        onboardingComplete: true,
        interests,
        experienceLevel,
        preferences: {
          onboardingSkipped: skipped,
          interests,
          experienceLevel,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
