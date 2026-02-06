import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs info messages', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('test message', { userId: '123' });
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0];
    expect(output).toContain('test message');
  });

  it('logs error messages to stderr', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('something broke', { code: 'ERR' });
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0];
    expect(output).toContain('something broke');
  });

  it('logs warn messages', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('caution');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('includes metadata in output', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('event', { action: 'click', count: 5 });
    const output = spy.mock.calls[0][0];
    expect(output).toContain('action');
    expect(output).toContain('click');
  });
});
