import { describe, expect, it, vi } from 'vitest';
import {
  DatabaseProbe,
  DatabaseUnavailable,
} from '../../application/database-probe.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('checks connectivity through its application port', async () => {
    const databaseHealth = {
      ping: vi.fn().mockResolvedValue(undefined),
    } satisfies DatabaseProbe;
    const controller = new HealthController(databaseHealth);

    await expect(controller.getHealth()).resolves.toEqual({
      data: { status: 'ok' },
    });
    expect(databaseHealth.ping).toHaveBeenCalledOnce();
  });

  it('propagates database unavailability without mapping rows', async () => {
    const failure = new DatabaseUnavailable();
    const databaseHealth = {
      ping: vi.fn().mockRejectedValue(failure),
    } satisfies DatabaseProbe;
    const controller = new HealthController(databaseHealth);

    await expect(controller.getHealth()).rejects.toBe(failure);
  });
});
