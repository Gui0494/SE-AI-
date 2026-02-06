import { RateLimitError } from '../errors';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — acceptable for single-process deployments.
// For serverless/multi-instance, replace with Redis (Upstash) or DB-backed counting.
const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

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

/**
 * Lazily clean up expired entries (avoids setInterval in serverless).
 */
function cleanupStale(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(userId: string, plan: string): RateLimitResult {
  cleanupStale();

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
  return {
    allowed: entry.count < limits.messages,
    remaining,
    resetAt: entry.resetAt,
    limit: limits.messages,
  };
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
