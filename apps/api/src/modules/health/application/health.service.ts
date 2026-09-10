import { Injectable } from '@nestjs/common';
import { DatabaseProbe } from './database-probe.js';
@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseProbe) {}
  getHealth(): Promise<void> {
    return this.database.ping();
  }
}
