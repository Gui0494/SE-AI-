import { db } from './db';
import { logger } from './logger';

export interface PlatformStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  activeUsersToday: number;
  messagesLast24h: number;
  messagesLast7d: number;
  planDistribution: Record<string, number>;
  topModels: { model: string; count: number }[];
  revenueTotal: number;
  signupsLast7d: number;
}

/**
 * Gather platform-wide analytics from existing database tables.
 * No separate analytics table needed — derives everything from Users, Messages, Subscriptions.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      totalUsers,
      totalChats,
      totalMessages,
      messagesLast24h,
      messagesLast7d,
      signupsLast7d,
      planCounts,
      topModelsRaw,
      revenueAgg,
      activeUsersRaw,
    ] = await Promise.all([
      db.user.count(),
      db.chat.count(),
      db.message.count(),
      db.message.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.subscription.groupBy({ by: ['plan'], _count: true }),
      db.message.groupBy({
        by: ['model'],
        _count: true,
        where: { model: { not: null }, role: 'assistant' },
        orderBy: { _count: { model: 'desc' } },
        take: 10,
      }),
      db.subscription.aggregate({ _sum: { totalCost: true } }),
      db.message.findMany({
        where: { role: 'user', createdAt: { gte: oneDayAgo } },
        select: { chat: { select: { userId: true } } },
        distinct: ['chatId'],
      }),
    ]);

    const planDistribution: Record<string, number> = {};
    for (const p of planCounts) {
      planDistribution[p.plan] = p._count;
    }

    const topModels = topModelsRaw
      .filter((m) => m.model)
      .map((m) => ({ model: m.model!, count: m._count }));

    const activeUserIds = new Set(activeUsersRaw.map((m) => m.chat.userId));

    return {
      totalUsers,
      totalChats,
      totalMessages,
      activeUsersToday: activeUserIds.size,
      messagesLast24h,
      messagesLast7d,
      planDistribution,
      topModels,
      revenueTotal: revenueAgg._sum.totalCost || 0,
      signupsLast7d,
    };
  } catch (error) {
    logger.error('analytics.stats_error', { error: error instanceof Error ? error.message : 'Unknown' });
    throw error;
  }
}

export interface UserListItem {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  plan: string;
  messagesUsed: number;
  totalCost: number;
  chatCount: number;
}

export async function getUserList(options: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ users: UserListItem[]; total: number }> {
  const { page = 1, limit = 50, search } = options;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { select: { plan: true, messagesUsed: true, totalCost: true } },
        _count: { select: { chats: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      plan: u.subscription?.plan || 'FREE',
      messagesUsed: u.subscription?.messagesUsed || 0,
      totalCost: u.subscription?.totalCost || 0,
      chatCount: u._count.chats,
    })),
    total,
  };
}
