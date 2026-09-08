import { describe, expect, it, vi } from 'vitest';
import { DatabaseHealth } from '../../common/database/database-health.js';
import { AppException } from '../../common/errors/app-exception.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('returns the mapped health contract when the database pings', async () => {
    const databaseHealth = {
      ping: vi.fn().mockResolvedValue(undefined),
    } as unknown as DatabaseHealth;
    const service = new HealthService(databaseHealth);

    await expect(service.getHealth()).resolves.toEqual({
      data: { status: 'ok' },
    });
    expect(databaseHealth.ping).toHaveBeenCalledOnce();
  });

  it('propagates database unavailability without mapping rows', async () => {
    const failure = new AppException({
      status: 503,
      code: 'DATABASE_UNAVAILABLE',
      title: 'Service Unavailable',
      detail: 'Database connectivity check failed',
    });
    const databaseHealth = {
      ping: vi.fn().mockRejectedValue(failure),
    } as unknown as DatabaseHealth;
    const service = new HealthService(databaseHealth);

    await expect(service.getHealth()).rejects.toBe(failure);
  });
});
