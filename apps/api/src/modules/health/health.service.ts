import { Injectable } from '@nestjs/common';
import { DatabaseHealth } from '../../common/database/database-health.js';
import { HealthResponseDto, toHealthResponse } from './health.dto.js';

@Injectable()
export class HealthService {
  constructor(private readonly databaseHealth: DatabaseHealth) {}

  async getHealth(): Promise<HealthResponseDto> {
    await this.databaseHealth.ping();
    return toHealthResponse();
  }
}
