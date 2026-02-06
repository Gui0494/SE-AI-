import { RateLimitError } from '../errors';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production)
const store = new Map<string, RateLimitEntry>();

const PLAN_LIMITS: Record<string, { messages: number; windowMs: number }> = {
  FREE: { messages: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20/day
  PRO: { messages: 500, windowMs: 24 * 60 * 60 * 1000 }, // 500/day
  ENTERPRISE: { messages: 10000, windowMs: 24 * 60 * 60 * 1000 }, // 10000/day
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkRateLimit(userId: string, plan: string): RateLimitResult {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const key = `rate:${userId}`;
  const now = Date.now();

  let entry = store.get(key);

  // Reset if window expired
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + limits.windowMs };
    store.set(key, entry);
  }

  const remaining = Math.max(0, limits.messages - entry.count);
  const result: RateLimitResult = {
    allowed: entry.count < limits.messages,
    remaining,
    resetAt: entry.resetAt,
    limit: limits.messages,
  };

  return result;
}

export function incrementRateLimit(userId: string, plan: string): void {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const key = `rate:${userId}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + limits.windowMs };
  } else {
    entry.count++;
  }

  store.set(key, entry);
}

export function enforceRateLimit(userId: string, plan: string): RateLimitResult {
  const result = checkRateLimit(userId, plan);
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    throw new RateLimitError(retryAfter);
  }
  return result;
}

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}
