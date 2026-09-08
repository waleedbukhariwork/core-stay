import { describe, expect, it, vi } from 'vitest';
import { AppException } from '../errors/app-exception.js';
import { DatabaseHealth } from './database-health.js';

describe('DatabaseHealth', () => {
  it('succeeds when SELECT 1 works', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    };
    const health = new DatabaseHealth(pool as never);
    await expect(health.ping()).resolves.toBeUndefined();
  });

  it('maps driver failures to a safe 503', async () => {
    const pool = {
      query: vi
        .fn()
        .mockRejectedValue(new Error('password authentication failed')),
    };
    const health = new DatabaseHealth(pool as never);

    try {
      await health.ping();
      throw new Error('expected ping to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      const exception = error as AppException;
      expect(exception.getStatus()).toBe(503);
      expect(exception.code).toBe('DATABASE_UNAVAILABLE');
      expect(JSON.stringify(exception)).not.toContain('password');
    }
  });
});
