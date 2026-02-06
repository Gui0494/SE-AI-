import { describe, it, expect } from 'vitest';
import {
  AppError,
  RateLimitError,
  AuthenticationError,
  InsufficientPlanError,
  AIProviderError,
  ValidationError,
  formatErrorResponse,
} from './index';

describe('Error classes', () => {
  it('RateLimitError has correct properties', () => {
    const err = new RateLimitError(30);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(err.retryable).toBe(true);
    expect(err.retryAfter).toBe(30);
    expect(err.message).toContain('30 seconds');
  });

  it('AuthenticationError has correct properties', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('AUTHENTICATION_REQUIRED');
    expect(err.retryable).toBe(false);
  });

  it('InsufficientPlanError includes plan info', () => {
    const err = new InsufficientPlanError('PRO', 'FREE');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('INSUFFICIENT_PLAN');
    expect(err.requiredPlan).toBe('PRO');
    expect(err.currentPlan).toBe('FREE');
    expect(err.message).toContain('PRO');
    expect(err.message).toContain('FREE');
  });

  it('AIProviderError includes provider', () => {
    const err = new AIProviderError('timeout', 'openai', 502, true);
    expect(err.statusCode).toBe(502);
    expect(err.provider).toBe('openai');
    expect(err.retryable).toBe(true);
  });

  it('ValidationError includes fields', () => {
    const err = new ValidationError('bad input', { email: 'required' });
    expect(err.statusCode).toBe(400);
    expect(err.fields).toEqual({ email: 'required' });
  });
});

describe('formatErrorResponse', () => {
  it('formats AppError correctly', () => {
    const err = new RateLimitError(60);
    const formatted = formatErrorResponse(err);
    expect(formatted.statusCode).toBe(429);
    expect(formatted.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(formatted.retryable).toBe(true);
  });

  it('formats ValidationError with fields', () => {
    const err = new ValidationError('bad', { name: 'too short' });
    const formatted = formatErrorResponse(err);
    expect(formatted.details).toEqual({ fields: { name: 'too short' } });
  });

  it('formats generic Error', () => {
    const formatted = formatErrorResponse(new Error('oops'));
    expect(formatted.statusCode).toBe(500);
    expect(formatted.code).toBe('INTERNAL_ERROR');
    expect(formatted.error).toBe('oops');
  });

  it('formats unknown error', () => {
    const formatted = formatErrorResponse('string error');
    expect(formatted.statusCode).toBe(500);
    expect(formatted.code).toBe('INTERNAL_ERROR');
  });
});
