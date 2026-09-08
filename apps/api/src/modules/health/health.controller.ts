import { Controller, Get } from '@nestjs/common';
import { HealthResponseDto } from './health.dto.js';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): Promise<HealthResponseDto> {
    return this.healthService.getHealth();
  }
}
