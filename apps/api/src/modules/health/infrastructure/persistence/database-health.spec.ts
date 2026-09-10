import { describe, expect, it, vi } from 'vitest';
import { DatabaseUnavailable } from '../../application/database-probe.js';
import { DatabaseHealth } from './database-health.js';

describe('DatabaseHealth', () => {
  it('succeeds when SELECT 1 works', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    };
    const health = new DatabaseHealth(pool as never);
    await expect(health.ping()).resolves.toBeUndefined();
  });

  it('translates driver failures without leaking details', async () => {
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
      expect(error).toBeInstanceOf(DatabaseUnavailable);
      const exception = error as DatabaseUnavailable;
      expect(exception.message).toBe('Database connectivity check failed');
      expect(JSON.stringify(exception)).not.toContain('password');
    }
  });
});
