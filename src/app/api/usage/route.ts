import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatErrorResponse, AuthenticationError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const plan = subscription?.plan || 'FREE';
    const rateLimit = checkRateLimit(session.user.id, plan);

    // Get recent usage stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMessages = await db.message.count({
      where: {
        chat: { userId: session.user.id },
        role: 'assistant',
        createdAt: { gte: today },
      },
    });

    const totalMessages = await db.message.count({
      where: {
        chat: { userId: session.user.id },
        role: 'assistant',
      },
    });

    const costAgg = await db.message.aggregate({
      where: {
        chat: { userId: session.user.id },
        role: 'assistant',
        cost: { not: null },
      },
      _sum: { cost: true, tokensIn: true, tokensOut: true },
    });

    return NextResponse.json({
      plan,
      subscription: subscription
        ? {
            status: subscription.status,
            messagesUsed: subscription.messagesUsed,
            messagesLimit: subscription.messagesLimit,
            tokensUsed: subscription.tokensUsed,
            totalCost: subscription.totalCost,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      rateLimit: {
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      usage: {
        todayMessages,
        totalMessages,
        totalCost: costAgg._sum.cost || 0,
        totalTokensIn: costAgg._sum.tokensIn || 0,
        totalTokensOut: costAgg._sum.tokensOut || 0,
      },
    });
  } catch (error) {
    const formatted = formatErrorResponse(error);
    return NextResponse.json(
      { error: formatted.error, code: formatted.code },
      { status: formatted.statusCode }
    );
  }
}
