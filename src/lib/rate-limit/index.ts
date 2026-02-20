import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { RateLimitError } from '../errors';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

const PLAN_LIMITS: Record<string, { messages: number; windowMs: number }> = {
  FREE: { messages: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20/day
  PRO: { messages: 500, windowMs: 24 * 60 * 60 * 1000 }, // 500/day
  ENTERPRISE: { messages: 10000, windowMs: 24 * 60 * 60 * 1000 }, // 10000/day
};

// --- Redis-backed rate limiter (production) ---

let _redisLimiters: Record<string, Ratelimit> | null = null;

function getRedisLimiters(): Record<string, Ratelimit> | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!_redisLimiters) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    _redisLimiters = {
      FREE: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(PLAN_LIMITS.FREE.messages, '1 d'),
        prefix: 'rl:free',
      }),
      PRO: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(PLAN_LIMITS.PRO.messages, '1 d'),
        prefix: 'rl:pro',
      }),
      ENTERPRISE: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(PLAN_LIMITS.ENTERPRISE.messages, '1 d'),
        prefix: 'rl:enterprise',
      }),
    };
  }
  return _redisLimiters;
}

// --- In-memory fallback (development / single-process) ---

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupStale(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of memStore.entries()) {
    if (now >= entry.resetAt) memStore.delete(key);
  }
}

function memCheckRateLimit(userId: string, plan: string): RateLimitResult {
  cleanupStale();
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const key = `rate:${userId}`;
  const now = Date.now();

  let entry = memStore.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + limits.windowMs };
    memStore.set(key, entry);
  }

  const remaining = Math.max(0, limits.messages - entry.count);
  return {
    allowed: entry.count < limits.messages,
    remaining,
    resetAt: entry.resetAt,
    limit: limits.messages,
  };
}

function memIncrementRateLimit(userId: string, plan: string): void {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const key = `rate:${userId}`;
  const now = Date.now();

  let entry = memStore.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + limits.windowMs };
  } else {
    entry.count++;
  }
  memStore.set(key, entry);
}

// --- Public API (auto-selects Redis or in-memory) ---

export function checkRateLimit(userId: string, plan: string): RateLimitResult {
  // Redis check is async, so for the sync checkRateLimit we always use memory
  // The async enforceRateLimit below uses Redis when available
  return memCheckRateLimit(userId, plan);
}

export function incrementRateLimit(userId: string, plan: string): void {
  memIncrementRateLimit(userId, plan);
}

export async function enforceRateLimitAsync(userId: string, plan: string): Promise<RateLimitResult> {
  const redisLimiters = getRedisLimiters();
  if (redisLimiters) {
    const limiter = redisLimiters[plan] || redisLimiters.FREE;
    const result = await limiter.limit(userId);
    if (!result.success) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      throw new RateLimitError(retryAfter);
    }
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
      limit: PLAN_LIMITS[plan]?.messages || PLAN_LIMITS.FREE.messages,
    };
  }

  // Fallback to in-memory
  return enforceRateLimit(userId, plan);
}

export function enforceRateLimit(userId: string, plan: string): RateLimitResult {
  const result = checkRateLimit(userId, plan);
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    throw new RateLimitError(retryAfter);
  }
  return result;
}
