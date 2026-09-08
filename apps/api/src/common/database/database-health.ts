import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { AppException } from '../errors/app-exception.js';
import { PG_POOL } from './database.tokens.js';

@Injectable()
export class DatabaseHealth {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async ping(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
    } catch {
      throw new AppException({
        status: 503,
        code: 'DATABASE_UNAVAILABLE',
        title: 'Service Unavailable',
        detail: 'Database connectivity check failed',
      });
    }
  }
}
