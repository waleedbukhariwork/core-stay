import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Registered HTTP contract', () => {
  it('registers each supported route exactly once', async () => {
    const app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    try {
      const routes: string[] = [];
      for (const module of app.get(ModulesContainer).values()) {
        for (const controller of module.controllers.values()) {
          const type = controller.metatype!;
          const prefix = Reflect.getMetadata(PATH_METADATA, type) as string;
          for (const key of Object.getOwnPropertyNames(type.prototype)) {
            const handler = type.prototype[key];
            const method = Reflect.getMetadata(METHOD_METADATA, handler) as
              RequestMethod | undefined;
            if (method === undefined) continue;
            const path = Reflect.getMetadata(PATH_METADATA, handler) as string;
            routes.push(
              `${RequestMethod[method]} /api/v1/${[prefix, path].filter((part) => part && part !== '/').join('/')}`,
            );
          }
        }
      }
      expect(routes.sort()).toEqual([
        'GET /api/v1/auth/me',
        'GET /api/v1/health',
        'GET /api/v1/profile',
        'GET /api/v1/profile/catalog',
        'PATCH /api/v1/profile',
        'POST /api/v1/auth/email-verification/resend',
        'POST /api/v1/auth/email-verification/verify',
        'POST /api/v1/auth/login',
        'POST /api/v1/auth/logout',
        'POST /api/v1/auth/logout-all',
        'POST /api/v1/auth/refresh',
        'POST /api/v1/auth/register',
      ]);
    } finally {
      await app.close();
    }
  });
});
