import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import {
  DatabaseProbe,
  DatabaseUnavailable,
} from '../../application/database-probe.js';
import { PG_POOL } from '../../../../platform/database/database.tokens.js';

@Injectable()
export class DatabaseHealth extends DatabaseProbe {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {
    super();
  }

  async ping(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
    } catch {
      throw new DatabaseUnavailable();
    }
  }
}
