import { Controller, Get } from '@nestjs/common';
import type { HealthResponseDto } from './dto/health-response.dto.js';
import { toHealthResponse } from './health-response.mapper.js';
import { DatabaseProbe } from '../../application/database-probe.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseProbe) {}

  @Get()
  async getHealth(): Promise<HealthResponseDto> {
    await this.database.ping();
    return toHealthResponse();
  }
}
