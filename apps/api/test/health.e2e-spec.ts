import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { DatabaseHealth } from '../src/modules/health/infrastructure/persistence/database-health.js';
import { DatabaseUnavailable } from '../src/modules/health/application/database-probe.js';
import { applyHttpGlobals } from '../src/platform/http/http.module.js';

describe('Health (e2e)', () => {
  let app: INestApplication;
  const ping = vi.fn();

  beforeEach(async () => {
    ping.mockReset();
    ping.mockResolvedValue(undefined);
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseHealth)
      .useValue({ ping })
      .compile();

    app = moduleFixture.createNestApplication();
    applyHttpGlobals(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns the explicit contract', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
  });

  it('GET /api/v1/health returns problem details when the database is down', async () => {
    ping.mockRejectedValue(new DatabaseUnavailable());

    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.headers['content-type']).toContain(
      'application/problem+json',
    );
    expect(response.body).toMatchObject({
      title: 'Service Unavailable',
      status: 503,
      code: 'DATABASE_UNAVAILABLE',
      detail: 'Database connectivity check failed',
    });
    expect(response.body).not.toHaveProperty('stack');
  });
});
