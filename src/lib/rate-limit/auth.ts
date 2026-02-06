/**
 * Rate limiting for auth endpoints (login, register).
 * Uses IP-based in-memory limiting. For production with Redis, use Upstash.
 */

interface AuthRateLimitEntry {
  count: number;
  resetAt: number;
}

const authStore = new Map<string, AuthRateLimitEntry>();
const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const AUTH_MAX_ATTEMPTS = 10; // 10 attempts per 15 min window
const REGISTER_MAX_ATTEMPTS = 5; // 5 registrations per 15 min window

function getIpKey(ip: string, action: string): string {
  return `auth:${action}:${ip}`;
}

export function checkAuthRateLimit(
  ip: string,
  action: 'login' | 'register'
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const key = getIpKey(ip, action);
  const now = Date.now();
  const maxAttempts = action === 'register' ? REGISTER_MAX_ATTEMPTS : AUTH_MAX_ATTEMPTS;

  let entry = authStore.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + AUTH_WINDOW_MS };
    authStore.set(key, entry);
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterMs: 0,
  };
}
