import { describe, it, expect } from 'vitest';
import { checkRateLimit, incrementRateLimit, enforceRateLimit } from './index';
import { RateLimitError } from '../errors';

describe('rate-limit (in-memory)', () => {
  const testUser = `test-user-${Date.now()}`;

  it('allows requests under the limit', () => {
    const result = checkRateLimit(testUser, 'FREE');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
    expect(result.limit).toBe(20);
  });

  it('increments the counter', () => {
    const user = `counter-test-${Date.now()}`;
    const before = checkRateLimit(user, 'FREE');
    incrementRateLimit(user, 'FREE');
    const after = checkRateLimit(user, 'FREE');
    expect(after.remaining).toBe(before.remaining - 1);
  });

  it('enforceRateLimit throws when limit exceeded', () => {
    const user = `limit-test-${Date.now()}`;
    // Exhaust the limit (FREE = 20)
    for (let i = 0; i < 20; i++) {
      incrementRateLimit(user, 'FREE');
    }
    expect(() => enforceRateLimit(user, 'FREE')).toThrow(RateLimitError);
  });

  it('uses plan-specific limits', () => {
    const user = `plan-test-${Date.now()}`;
    const freeResult = checkRateLimit(user, 'FREE');
    expect(freeResult.limit).toBe(20);

    const proUser = `pro-test-${Date.now()}`;
    const proResult = checkRateLimit(proUser, 'PRO');
    expect(proResult.limit).toBe(500);
  });

  it('falls back to FREE limits for unknown plan', () => {
    const user = `unknown-plan-${Date.now()}`;
    const result = checkRateLimit(user, 'UNKNOWN');
    expect(result.limit).toBe(20);
  });
});
