import { Controller, Get } from '@nestjs/common';
import { HealthResponseDto, toHealthResponse } from './health.dto.js';
import { HealthService } from '../../application/health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(): Promise<HealthResponseDto> {
    await this.healthService.getHealth();
    return toHealthResponse();
  }
}
