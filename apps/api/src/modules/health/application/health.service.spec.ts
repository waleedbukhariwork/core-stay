import { describe, expect, it, vi } from 'vitest';
import { DatabaseProbe, DatabaseUnavailable } from './database-probe.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('checks connectivity through its application port', async () => {
    const databaseHealth = {
      ping: vi.fn().mockResolvedValue(undefined),
    } satisfies DatabaseProbe;
    const service = new HealthService(databaseHealth);

    await expect(service.getHealth()).resolves.toBeUndefined();
    expect(databaseHealth.ping).toHaveBeenCalledOnce();
  });

  it('propagates database unavailability without mapping rows', async () => {
    const failure = new DatabaseUnavailable();
    const databaseHealth = {
      ping: vi.fn().mockRejectedValue(failure),
    } satisfies DatabaseProbe;
    const service = new HealthService(databaseHealth);

    await expect(service.getHealth()).rejects.toBe(failure);
  });
});
