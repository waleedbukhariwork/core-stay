import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { applyHttpGlobals } from '../src/platform/http/http.module.js';
import {
  IdentityApi,
  type AuthenticatedActor,
} from '../src/modules/identity/public/identity.api.js';
import { identityFailure } from '../src/modules/identity/domain/identity-failure.js';
import { ProfileRepository } from '../src/modules/profile/application/ports/profile.repository.js';
import { emptyPreferences } from '../src/modules/profile/domain/profile.js';

describe('Profile HTTP contract', () => {
  let app: INestApplication;
  const actor: AuthenticatedActor = {
    kind: 'user',
    userId: 'authenticated-user',
    sessionId: 'live-session',
  };
  const identity = {
    authenticate: vi.fn(),
    assertActiveVerified: vi.fn(),
    assertAuthenticated: vi.fn(),
  } satisfies IdentityApi;
  const repository = {
    find: vi.fn(),
    update: vi.fn(),
  } satisfies ProfileRepository;

  beforeEach(async () => {
    vi.resetAllMocks();
    identity.authenticate.mockResolvedValue(actor);
    identity.assertActiveVerified.mockResolvedValue(undefined);
    repository.find.mockResolvedValue(undefined);
    const fixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(IdentityApi)
      .useValue(identity)
      .overrideProvider(ProfileRepository)
      .useValue(repository)
      .compile();
    app = fixture.createNestApplication();
    applyHttpGlobals(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns only public preferences and progress, using authenticated ownership', async () => {
    repository.find.mockResolvedValue({
      ...emptyPreferences(),
      goals: ['fundamentals'],
      userId: 'internal-id',
      updatedAt: new Date(),
      internal: 'private',
    });
    const response = await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Authorization', 'Bearer access');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({
      data: {
        preferences: { ...emptyPreferences(), goals: ['fundamentals'] },
        status: 'in_progress',
        nextStep: 'role',
      },
    });
    expect(identity.authenticate).toHaveBeenCalledWith('access');
    expect(identity.assertActiveVerified).toHaveBeenCalledWith(actor);
    expect(repository.find).toHaveBeenCalledWith(actor.userId);
  });

  it('validates and normalizes a partial update before returning the saved state', async () => {
    repository.update.mockResolvedValue({
      ...emptyPreferences(),
      goals: ['stay_current', 'fundamentals'],
    });
    const response = await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('Authorization', 'Bearer access')
      .send({ goals: ['fundamentals', 'stay_current'] });
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(repository.update).toHaveBeenCalledExactlyOnceWith(actor.userId, {
      goals: ['stay_current', 'fundamentals'],
    });
    expect(response.body).toEqual({
      data: {
        preferences: {
          ...emptyPreferences(),
          goals: ['stay_current', 'fundamentals'],
        },
        status: 'in_progress',
        nextStep: 'role',
      },
    });
  });

  it('preserves catalog keys, metadata and numeric time identifiers', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/profile/catalog')
      .set('Authorization', 'Bearer access');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(Object.keys(response.body)).toEqual(['data']);
    expect(Object.keys(response.body.data)).toEqual([
      'goals',
      'role',
      'experience',
      'technologies',
      'focusAreas',
      'dailyMinutes',
      'learningPreferences',
    ]);
    expect(response.body.data.dailyMinutes[1]).toEqual({
      id: 10,
      label: '10 minutes',
      enabled: true,
      order: 1,
      category: null,
      exclusiveGroup: null,
      recommended: true,
    });
    expect(response.body.data.learningPreferences[0].exclusiveGroup).toBe(
      'primary_approach',
    );
    expect(identity.assertActiveVerified).toHaveBeenCalledWith(actor);
    expect(repository.find).not.toHaveBeenCalled();
  });

  it.each([
    [{ goals: null }, 'VALIDATION_ERROR'],
    [{ goals: [] }, 'VALIDATION_ERROR'],
    [{ goals: ['fundamentals', 'fundamentals'] }, 'VALIDATION_ERROR'],
    [{ goals: 'fundamentals' }, 'VALIDATION_ERROR'],
    [{ role: 'unsupported' }, 'VALIDATION_ERROR'],
    [{ dailyMinutes: 7 }, 'VALIDATION_ERROR'],
    [{ userId: 'another-user', goals: ['fundamentals'] }, 'VALIDATION_ERROR'],
    [{}, 'INVALID_PREFERENCES'],
    [
      { learningPreferences: ['challenge_first', 'explain_first'] },
      'INVALID_PREFERENCES',
    ],
  ])(
    'preserves validation errors and prevents writes for %j',
    async (body, code) => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/profile')
        .set('Authorization', 'Bearer access')
        .send(body);
      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toContain(
        'application/problem+json',
      );
      expect(response.body).toMatchObject({ status: 400, code });
      expect(repository.update).not.toHaveBeenCalled();
    },
  );

  it.each(['read', 'catalog', 'update'])(
    'denies unauthenticated and revoked access to %s',
    async (operation) => {
      const call = () =>
        operation === 'update'
          ? request(app.getHttpServer())
              .patch('/api/v1/profile')
              .send({ goals: ['fundamentals'] })
          : request(app.getHttpServer()).get(
              `/api/v1/profile${operation === 'catalog' ? '/catalog' : ''}`,
            );
      const missing = await call();
      expect(missing.status).toBe(401);
      expect(missing.body.code).toBe('ACCESS_TOKEN_INVALID');
      expect(identity.authenticate).not.toHaveBeenCalled();
      identity.assertActiveVerified.mockRejectedValue(
        identityFailure('SESSION_REVOKED'),
      );
      const revoked = await call().set('Authorization', 'Bearer access');
      expect(revoked.status).toBe(401);
      expect(revoked.body.code).toBe('SESSION_REVOKED');
      expect(repository.find).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    },
  );
});
